import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from .models import Sala, Ronda, RespuestaJugador, PerfilUsuario

# Estado en memoria para desarrollo
_salas_activas = {}

class JuegoConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.sala_codigo = self.scope['url_route']['kwargs']['sala_codigo'].upper()
        self.sala_group_name = f'juego_{self.sala_codigo}'

        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        if self.sala_codigo not in _salas_activas:
            _salas_activas[self.sala_codigo] = {
                'estado': 'esperando',
                'stop_solicitado_por': None,
                'temporizador_task': None
            }

        await self.channel_layer.group_add(self.sala_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.sala_codigo in _salas_activas:
            task = _salas_activas[self.sala_codigo].get('temporizador_task')
            if task and not task.done():
                task.cancel()

        await self.channel_layer.group_discard(self.sala_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            evento = data.get('action')

            if evento == 'iniciar_ronda':
                letra = data.get('letra', 'A')
                await self._handle_iniciar_ronda(letra)
            elif evento == 'presionar_stop':
                await self._handle_presionar_stop()
            elif evento == 'siguiente_ronda':
                await self._handle_siguiente_ronda()
            else:
                await self.send(text_data=json.dumps({'error': 'Acción no reconocida'}))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'JSON inválido'}))

    async def _handle_iniciar_ronda(self, letra):
        estado = _salas_activas.get(self.sala_codigo, {}).get('estado')
        if estado != 'esperando' and estado != 'terminada':
            return

        success = await self.crear_ronda_en_postgres(self.sala_codigo, letra)
        if not success: return

        _salas_activas[self.sala_codigo]['estado'] = 'en_ronda'
        await self.channel_layer.group_send(
            self.sala_group_name, {'type': 'notificar_inicio', 'letra': letra}
        )

    async def _handle_presionar_stop(self):
        estado = _salas_activas.get(self.sala_codigo, {}).get('estado')
        if estado != 'en_ronda': return

        _salas_activas[self.sala_codigo]['estado'] = 'cuenta_regresiva'
        _salas_activas[self.sala_codigo]['stop_solicitado_por'] = self.channel_name

        await self.channel_layer.group_send(
            self.sala_group_name, 
            {'type': 'notificar_cuenta_regresiva', 'mensaje': '¡STOP! 10 segundos para terminar.'}
        )

        task = asyncio.create_task(self._temporizador_evaluar())
        _salas_activas[self.sala_codigo]['temporizador_task'] = task

    async def _temporizador_evaluar(self):
        try:
            await asyncio.sleep(10)
            _salas_activas[self.sala_codigo]['estado'] = 'evaluacion'

            # 🧮 Calcular puntajes automáticamente
            await self.calcular_y_guardar_puntajes(self.sala_codigo)
            resultados = await self.obtener_resultados_ronda(self.sala_codigo)

            await self.channel_layer.group_send(
                self.sala_group_name, 
                {'type': 'notificar_resultados', 'resultados': resultados}
            )

            await self.desactivar_ronda_en_postgres(self.sala_codigo)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"⚠️ Error en temporizador: {str(e)}")

    @database_sync_to_async
    @transaction.atomic
    def crear_ronda_en_postgres(self, codigo_sala, letra):
        try:
            sala = Sala.objects.select_for_update().get(codigo=codigo_sala)
            sala.estado = 'en_ronda'
            sala.save()
            num = Ronda.objects.filter(sala=sala).count() + 1
            Ronda.objects.create(sala=sala, numero_ronda=num, letra=letra, activa=True)
            return True
        except Exception as e:
            print(f"💥 Error creando ronda: {e}")
            return False

    @database_sync_to_async
    def desactivar_ronda_en_postgres(self, codigo_sala):
        try:
            ronda = Ronda.objects.filter(sala__codigo=codigo_sala, activa=True).latest('id')
            ronda.activa = False
            ronda.save()
            return True
        except: return False

    # 🧠 LÓGICA DE PUNTAJE (100 único, 50 repetido, 0 vacío)
    @database_sync_to_async
    def calcular_y_guardar_puntajes(self, codigo_sala):
        try:
            ronda = Ronda.objects.filter(sala__codigo=codigo_sala, activa=True).latest('id')
            respuestas = list(RespuestaJugador.objects.filter(ronda=ronda).select_related('jugador'))
            if not respuestas: return True

            categorias = ['nombre', 'apellido', 'ciudad_pais', 'animal', 'cosa']
            pts_fields = [f'puntos_{c}' for c in categorias]

            # Resetear puntos previos
            RespuestaJugador.objects.filter(ronda=ronda).update(**{f: 0 for f in pts_fields}, total_puntos_ronda=0)

            for cat, pts_field in zip(categorias, pts_fields):
                agrupados = {}
                for resp in respuestas:
                    val = getattr(resp, cat, '').strip().lower()
                    if val: agrupados.setdefault(val, []).append(resp)

                for val, group in agrupados.items():
                    pts = 100 if len(group) == 1 else 50
                    RespuestaJugador.objects.filter(id__in=[r.id for r in group]).update(**{pts_field: pts})

            # Calcular totales y actualizar perfil
            for resp in respuestas:
                total = sum(getattr(resp, f, 0) for f in pts_fields)
                resp.total_puntos_ronda = total
                resp.save(update_fields=['total_puntos_ronda'])

                resp.jugador.puntaje_total += total
                resp.jugador.partidas_jugadas += 1
                resp.jugador.save(update_fields=['puntaje_total', 'partidas_jugadas'])

            return True
        except Exception as e:
            print(f"💥 Error calculando puntajes: {e}")
            return False

    @database_sync_to_async
    def obtener_resultados_ronda(self, codigo_sala):
        ronda = Ronda.objects.filter(sala__codigo=codigo_sala).latest('id')
        respuestas = RespuestaJugador.objects.filter(ronda=ronda).select_related('jugador__usuario')
        
        data = []
        for r in respuestas:
            data.append({
                'jugador': r.jugador.username,
                'puntaje_total_acumulado': r.jugador.puntaje_total,
                'total_ronda': r.total_puntos_ronda,
                'detalles': {
                    'nombre': r.nombre, 'pts': r.puntos_nombre,
                    'apellido': r.apellido, 'pts': r.puntos_apellido,
                    'ciudad_pais': r.ciudad_pais, 'pts': r.puntos_ciudad_pais,
                    'animal': r.animal, 'pts': r.puntos_animal,
                    'cosa': r.cosa, 'pts': r.puntos_cosa
                }
            })
        return sorted(data, key=lambda x: x['total_ronda'], reverse=True)

    async def _handle_siguiente_ronda(self):
        _salas_activas[self.sala_codigo]['estado'] = 'esperando'
        await self.channel_layer.group_send(
            self.sala_group_name, {'type': 'notificar_listo_siguiente', 'mensaje': 'Nueva ronda lista. Creador puede iniciar.'}
        )

    # 📡 Handlers de Grupo
    async def notificar_inicio(self, event):
        await self.send(text_data=json.dumps({'status': 'ronda_iniciada', 'letra': event['letra']}))

    async def notificar_cuenta_regresiva(self, event):
        await self.send(text_data=json.dumps({'status': 'stop_presionado', 'segundos_restantes': 10, 'mensaje': event['mensaje']}))

    async def notificar_resultados(self, event):
        await self.send(text_data=json.dumps({'status': 'resultados_ronda', 'resultados': event['resultados']}))

    async def notificar_listo_siguiente(self, event):
        await self.send(text_data=json.dumps({'status': 'listo_siguiente_ronda', 'mensaje': event['mensaje']}))