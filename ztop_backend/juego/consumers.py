import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from django.core.cache import cache
from .models import Sala, Ronda, RespuestaJugador, PerfilUsuario, SalaJugador

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
        
        # 🆕 Inicializamos la sala con el modo clásico por defecto en la caché
        if not room_state:
            room_state = {'estado': 'esperando', 'stop_solicitado_por': None, 'modo_juego': 'clasico'}
            await cache.aset(cache_key, room_state, timeout=86400)

        await self.channel_layer.group_add(self.sala_group_name, self.channel_name)
        await self.accept()

        # 🆕 Sincronizamos el modo actual para el jugador que acaba de entrar
        await self.send(json.dumps({
            'status': 'cambio_modo',
            'modo': room_state.get('modo_juego', 'clasico')
        }))

        # 📡 Notificar de inmediato a todos los miembros de la sala el ingreso del nuevo jugador
        info_lobby = await self.obtener_info_lobby()
        await self.channel_layer.group_send(self.sala_group_name, {
            'type': 'notificar_cambio_lobby',
            'jugadores': info_lobby['jugadores'],
            'creador': info_lobby['creador']
        })

    # 🚀 SOLUCIÓN AL DILEMA: Manejo inteligente de la desconexión
    async def disconnect(self, close_code):
        # 1. Lo sacamos del grupo de WebSockets
        await self.channel_layer.group_discard(self.sala_group_name, self.channel_name)
        
        # 2. Identificamos qué usuario se está yendo
        user = self.scope.get("user")
        if user and user.is_authenticated:
            # 3. Lo borramos físicamente de la sala en la base de datos
            await self.eliminar_jugador_de_sala(self.sala_codigo, user)
            
            # 4. Le avisamos inmediatamente a los teléfonos restantes que la lista cambió
            info_lobby = await self.obtener_info_lobby()
            await self.channel_layer.group_send(self.sala_group_name, {
                'type': 'notificar_cambio_lobby',
                'jugadores': info_lobby['jugadores'],
                'creador': info_lobby['creador']
            })

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
            # 🆕 Escuchamos la petición del frontend para cambiar las reglas de la sala
            elif evento == 'cambiar_modo':
                await self._handle_cambiar_modo(data.get('modo', 'clasico'))
        except json.JSONDecodeError:
            pass

    # 🆕 Función para procesar y validar el cambio de modo
    async def _handle_cambiar_modo(self, nuevo_modo):
        # 1. Validar que quien cambia el modo sea estrictamente el host/creador de la sala
        if not await self.es_creador(self.scope['user']):
            return

        # 2. Actualizar la caché global
        cache_key = f"ztop_sala:{self.sala_codigo}"
        room_state = await cache.aget(cache_key, {})
        room_state['modo_juego'] = nuevo_modo
        await cache.aset(cache_key, room_state, timeout=86400)
        
        # 3. Disparar evento a todos los miembros conectados
        await self.channel_layer.group_send(self.sala_group_name, {
            'type': 'notificar_cambio_modo',
            'modo': nuevo_modo
        })

    async def _handle_iniciar_ronda(self, letra):
        cache_key = f"ztop_sala:{self.sala_codigo}"
        room_state = await cache.aget(cache_key, {'estado': 'esperando'})
        
        if room_state.get('estado') not in ['esperando', 'terminada']:
            return

        if not await self.es_creador(self.scope['user']):
            await self.send(json.dumps({'error': 'Solo el creador de la sala puede iniciar la partida.'}))
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

        task = asyncio.create_task(self._temporizador_evaluar())
        _local_tasks[self.sala_codigo] = task

    async def _temporizador_evaluar(self):
        cache_key = f"ztop_sala:{self.sala_codigo}"
        try:
            await asyncio.sleep(10)
            room_state = await cache.aget(cache_key, {})
            room_state['estado'] = 'evaluacion'
            await cache.aset(cache_key, room_state, timeout=86400)

            await self.calcular_y_guardar_puntajes(self.sala_codigo)
            resultados = await self.obtener_resultados_ronda(self.sala_codigo)

            await self.channel_layer.group_send(self.sala_group_name, {'type': 'notificar_resultados', 'resultados': resultados})
            await self.desactivar_ronda_en_postgres(self.sala_codigo)
        finally:
            _local_tasks.pop(self.sala_codigo, None)

    # =======================================================
    # 🛠️ FUNCIONES DE BASE DE DATOS Y AYUDANTES (Helpers)
    # =======================================================

    # 🚀 NUEVO HELPER: Borra físicamente la relación del jugador con la sala
    @database_sync_to_async
    @transaction.atomic
    def eliminar_jugador_de_sala(self, codigo_sala, user):
        try:
            sala = Sala.objects.get(codigo=codigo_sala)
            SalaJugador.objects.filter(sala=sala, jugador__usuario=user).delete()
            return True
        except Exception as e:
            print(f"Error quitando al jugador de la sala: {e}")
            return False

    @database_sync_to_async
    def obtener_info_lobby(self):
        try:
            sala = Sala.objects.get(codigo=self.sala_codigo)
            miembros = SalaJugador.objects.filter(sala=sala).select_related('jugador')
            return {
                'jugadores': [{'username': m.jugador.username} for m in miembros],
                'creador': sala.creador.username
            }
        except Exception:
            return {'jugadores': [], 'creador': ''}

    @database_sync_to_async
    def es_creador(self, user):
        return Sala.objects.filter(codigo=self.sala_codigo, creador__usuario=user).exists()

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
            
            for cat in categorias:
                agrupados = {}
                for resp in respuestas:
                    val = getattr(resp, cat, '').strip().lower()
                    if val and val.startswith(letra_ronda):
                        agrupados.setdefault(val, []).append(resp)
                    else:
                        setattr(resp, f'puntos_{cat}', 0)
                
                for val, group in agrupados.items():
                    pts = 100 if len(group) == 1 else 50
                    for resp in group:
                        setattr(resp, f'puntos_{cat}', pts)

            max_puntos = -1
            for resp in respuestas:
                resp.total_puntos_ronda = (
                    resp.puntos_nombre + resp.puntos_apellido + 
                    resp.puntos_ciudad_pais + resp.puntos_animal + resp.puntos_cosa
                )
                if resp.total_puntos_ronda > max_puntos:
                    max_puntos = resp.total_puntos_ronda
                resp.save()
                
            # 🚀 AQUÍ ES DONDE SUCEDE LA MAGIA DE LA ECONOMÍA
            # Importamos Monedero aquí para evitar errores de importación circular
            from tienda.models import Monedero 

            for resp in respuestas:
                perfil = resp.jugador
                
                # 1. Guardamos las estadísticas normales del juego
                perfil.puntaje_total += resp.total_puntos_ronda
                perfil.partidas_jugadas += 1
                
                if resp.total_puntos_ronda == max_puntos and max_puntos > 0:
                    perfil.partidas_ganadas += 1
                
                perfil.save(update_fields=['puntaje_total', 'partidas_jugadas', 'partidas_ganadas'])
                
                # 2. 💰 NUEVO: Pago de Monedas (10% de los puntos de la ronda)
                if resp.total_puntos_ronda > 0:
                    tasa_conversion = 0.10
                    monedas_ganadas = int(resp.total_puntos_ronda * tasa_conversion)
                    
                    # Usamos get_or_create de forma segura por si el usuario es nuevo
                    monedero, created = Monedero.objects.get_or_create(perfil=perfil)
                    monedero.monedas += monedas_ganadas
                    monedero.save()
                    print(f"💰 Se pagaron {monedas_ganadas} monedas a {perfil.username}")
                
            return True
        except Exception as e:
            print(f"💥 Error crítico calculando puntajes: {e}")
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
                        'valor': getattr(r, cat) or '-',
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

    # =======================================================
    # 📡 Handlers de Comunicación por Grupos (Broadcasts)
    # =======================================================
    
    async def notificar_inicio(self, event): 
        await self.send(json.dumps({'status': 'ronda_iniciada', 'letra': event['letra']}))
        
    async def notificar_cuenta_regresiva(self, event): 
        await self.send(json.dumps({'status': 'stop_presionado', 'mensaje': event['mensaje']}))
        
    async def notificar_resultados(self, event): 
        await self.send(json.dumps({'status': 'resultados_ronda', 'resultados': event['resultados']}))
        
    async def notificar_listo_siguiente(self, event): 
        await self.send(json.dumps({'status': 'listo_siguiente_ronda', 'mensaje': event['mensaje']}))

    async def notificar_cambio_lobby(self, event):
        await self.send(json.dumps({
            'status': 'actualizar_lobby',
            'jugadores': event['jugadores'],
            'creador': event['creador']
        }))
        
    # 🆕 Handler para enviar la actualización del modo al frontend
    async def notificar_cambio_modo(self, event):
        await self.send(json.dumps({
            'status': 'cambio_modo',
            'modo': event['modo']
        }))