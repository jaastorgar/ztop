import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from django.core.cache import cache
from .models import Sala, Ronda, RespuestaJugador, PerfilUsuario

# ⏳ Almacenamiento local para las referencias de tareas del temporizador (No serializables)
_local_tasks = {}

class JuegoConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.sala_codigo = self.scope['url_route']['kwargs']['sala_codigo'].upper()
        self.sala_group_name = f'juego_{self.sala_codigo}'

        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        # 🚀 Leemos el estado global de la sala desde la caché de forma asíncrona
        cache_key = f"ztop_sala:{self.sala_codigo}"
        room_state = await cache.aget(cache_key)
        
        if not room_state:
            room_state = {'estado': 'esperando', 'stop_solicitado_por': None}
            await cache.aset(cache_key, room_state, timeout=86400)

        await self.channel_layer.group_add(self.sala_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # 🚀 El temporizador de la sala corre de forma independiente a las conexiones individuales.
        # Si un jugador móvil pierde señal, la partida continúa con normalidad para el resto.
        await self.channel_layer.group_discard(self.sala_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            evento = data.get('action')

            if evento == 'iniciar_ronda':
                await self._handle_iniciar_ronda(data.get('letra', 'A'))
            elif evento == 'presionar_stop':
                await self._handle_presionar_stop()
            elif evento == 'siguiente_ronda':
                await self._handle_siguiente_ronda()
        except json.JSONDecodeError:
            pass

    async def _handle_iniciar_ronda(self, letra):
        cache_key = f"ztop_sala:{self.sala_codigo}"
        room_state = await cache.aget(cache_key, {'estado': 'esperando'})
        
        if room_state.get('estado') not in ['esperando', 'terminada']:
            return

        success = await self.crear_ronda_en_postgres(self.sala_codigo, letra)
        if success:
            room_state['estado'] = 'en_ronda'
            await cache.aset(cache_key, room_state, timeout=86400)
            await self.channel_layer.group_send(self.sala_group_name, {'type': 'notificar_inicio', 'letra': letra})

    async def _handle_presionar_stop(self):
        cache_key = f"ztop_sala:{self.sala_codigo}"
        room_state = await cache.aget(cache_key, {})
        
        if room_state.get('estado') != 'en_ronda': 
            return

        room_state['estado'] = 'cuenta_regresiva'
        await cache.aset(cache_key, room_state, timeout=86400)

        await self.channel_layer.group_send(self.sala_group_name, {'type': 'notificar_cuenta_regresiva', 'mensaje': '¡STOP! 10 segundos.'})

        # Orquestamos la tarea del temporizador asíncrono en el servidor
        task = asyncio.create_task(self._temporizador_evaluar())
        _local_tasks[self.sala_codigo] = task

    async def _temporizador_evaluar(self):
        cache_key = f"ztop_sala:{self.sala_codigo}"
        try:
            await asyncio.sleep(10)
            room_state = await cache.aget(cache_key, {})
            room_state['estado'] = 'evaluacion'
            await cache.aset(cache_key, room_state, timeout=86400)

            # 🧮 Cálculo automático seguro en memoria y persistencia
            await self.calcular_y_guardar_puntajes(self.sala_codigo)
            resultados = await self.obtener_resultados_ronda(self.sala_codigo)

            await self.channel_layer.group_send(self.sala_group_name, {'type': 'notificar_resultados', 'resultados': resultados})
            await self.desactivar_ronda_en_postgres(self.sala_codigo)
        finally:
            _local_tasks.pop(self.sala_codigo, None)

    @database_sync_to_async
    @transaction.atomic
    def crear_ronda_en_postgres(self, codigo_sala, letra):
        sala = Sala.objects.get(codigo=codigo_sala)
        sala.estado = 'en_ronda'
        sala.save()
        num = Ronda.objects.filter(sala=sala).count() + 1
        Ronda.objects.create(sala=sala, numero_ronda=num, letra=letra, activa=True)
        return True

    @database_sync_to_async
    @transaction.atomic
    def desactivar_ronda_en_postgres(self, codigo_sala):
        ronda = Ronda.objects.filter(sala__codigo=codigo_sala, activa=True).latest('id')
        ronda.activa = False
        ronda.save()
        sala = Sala.objects.get(codigo=codigo_sala)
        sala.estado = 'esperando'
        sala.save()
        return True

    @database_sync_to_async
    @transaction.atomic
    def calcular_y_guardar_puntajes(self, codigo_sala):
        try:
            ronda = Ronda.objects.filter(sala__codigo=codigo_sala, activa=True).latest('id')
            letra_ronda = ronda.letra.strip().lower()
            respuestas = list(RespuestaJugador.objects.filter(ronda=ronda).select_related('jugador'))
            
            if not respuestas:
                return True

            categorias = ['nombre', 'apellido', 'ciudad_pais', 'animal', 'cosa']
            
            # Procesamos las evaluaciones directo sobre los objetos en memoria
            for cat in categorias:
                agrupados = {}
                for resp in respuestas:
                    val = getattr(resp, cat, '').strip().lower()
                    # Regla estricta: Debe contener texto y empezar con la letra correcta de la ronda
                    if val and val.startswith(letra_ronda):
                        agrupados.setdefault(val, []).append(resp)
                    else:
                        setattr(resp, f'puntos_{cat}', 0)
                
                # Asignamos los puntajes correspondientes según unicidad
                for val, group in agrupados.items():
                    pts = 100 if len(group) == 1 else 50
                    for resp in group:
                        setattr(resp, f'puntos_{cat}', pts)

            # Consolidamos los totales individuales y guardamos de manera persistente en Postgres
            for resp in respuestas:
                resp.total_puntos_ronda = (
                    resp.puntos_nombre + resp.puntos_apellido + 
                    resp.puntos_ciudad_pais + resp.puntos_animal + resp.puntos_cosa
                )
                # Al llamar a save(), guardamos simultáneamente las columnas de puntos y el total de la ronda
                resp.save()
                
                # Incrementamos de forma segura el acumulativo histórico del competidor móvil
                perfil = resp.jugador
                perfil.puntaje_total += resp.total_puntos_ronda
                # 🚀 SOLUCIÓN: Actualizamos únicamente el campo existente 'puntaje_total'
                perfil.save(update_fields=['puntaje_total'])
                
            return True
        except Exception as e:
            print(f"💥 Error crítico calculando puntajes en memoria distribuida: {e}")
            return False

    @database_sync_to_async
    def obtener_resultados_ronda(self, codigo_sala):
        ronda = Ronda.objects.filter(sala__codigo=codigo_sala).latest('id')
        respuestas = RespuestaJugador.objects.filter(ronda=ronda).select_related('jugador__usuario')
        
        resultados = []
        for r in respuestas:
            resultados.append({
                'jugador': r.jugador.username,
                'puntaje_total_acumulado': r.jugador.puntaje_total,
                'total_ronda': r.total_puntos_ronda,
                'detalles': {
                    cat: {
                        'valor': getattr(r, cat) or '-',  # Normalizado con guion para evitar inputs vacíos en el layout
                        'pts': getattr(r, f'puntos_{cat}')
                    } for cat in ['nombre', 'apellido', 'ciudad_pais', 'animal', 'cosa']
                }
            })
        return sorted(resultados, key=lambda x: x['total_ronda'], reverse=True)

    async def _handle_siguiente_ronda(self):
        cache_key = f"ztop_sala:{self.sala_codigo}"
        room_state = await cache.aget(cache_key, {})
        room_state['estado'] = 'esperando'
        await cache.aset(cache_key, room_state, timeout=86400)
        await self.channel_layer.group_send(self.sala_group_name, {'type': 'notificar_listo_siguiente', 'mensaje': 'Nueva ronda lista.'})

    # 📡 Handlers de Comunicación por Grupos (Broadcasts)
    async def notificar_inicio(self, event): 
        await self.send(json.dumps({'status': 'ronda_iniciada', 'letra': event['letra']}))
        
    async def notificar_cuenta_regresiva(self, event): 
        await self.send(json.dumps({'status': 'stop_presionado', 'mensaje': event['mensaje']}))
        
    async def notificar_resultados(self, event): 
        await self.send(json.dumps({'status': 'resultados_ronda', 'resultados': event['resultados']}))
        
    async def notificar_listo_siguiente(self, event): 
        await self.send(json.dumps({'status': 'listo_siguiente_ronda', 'mensaje': event['mensaje']}))