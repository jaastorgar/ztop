import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Sala, Ronda

class JuegoConsumer(AsyncWebsocketConsumer):
    # Diccionario en memoria para controlar el estado visual de los WebSockets
    salas_activas = {}

    # --- Métodos de interacción con PostgreSQL usando adaptadores asíncronos ---

    @database_sync_to_async
    def crear_ronda_en_postgres(self, codigo_sala, letra_seleccionada):
        try:
            sala = Sala.objects.get(codigo=codigo_sala.upper())
            
            # Cambiamos el estado de la sala a 'jugando' en la Base de Datos
            sala.estado = 'jugando'
            sala.save()

            # Calculamos el número de ronda contando las preexistentes
            numero_siguiente = Ronda.objects.filter(sala=sala).count() + 1
            
            # Insertamos la nueva ronda de forma persistente en PostgreSQL
            nueva_ronda = Ronda.objects.create(
                sala=sala,
                numero_ronda=numero_siguiente,
                letra=letra_seleccionada,
                activa=True
            )
            print(f"✨ [DATABASE] Ronda ID {nueva_ronda.id} (Letra {letra_seleccionada}) guardada en Postgres para sala {codigo_sala}")
            return True
        except Exception as e:
            print(f"💥 [DATABASE ERROR] Error al registrar ronda en Postgres: {str(e)}")
            return False

    @database_sync_to_async
    def desactivar_ronda_en_postgres(self, codigo_sala):
        try:
            # Al expirar los 10 segundos, desactivamos la ronda en PostgreSQL
            # para sincronizar el cierre estricto del backend
            rondas_activas = Ronda.objects.filter(sala__codigo=codigo_sala.upper(), activa=True)
            if rondas_activas.exists():
                ronda = rondas_activas.latest('id')
                ronda.activa = False
                ronda.save()
                print(f"🔒 [DATABASE] Ronda ID {ronda.id} marcada como INACTIVA (activa=False) en Postgres.")
                return True
            return False
        except Exception as e:
            print(f"💥 [DATABASE ERROR] No se pudo desactivar la ronda: {str(e)}")
            return False

    # --- Métodos del Ciclo de Vida del WebSocket ---

    async def connect(self):
        self.sala_codigo = self.scope['url_route']['kwargs']['sala_codigo'].upper()
        self.sala_group_name = f'juego_{self.sala_codigo}'

        # Inicializar el estado de la sala si es nueva
        if self.sala_codigo not in self.salas_activas:
            self.salas_activas[self.sala_codigo] = {
                'estado': 'esperando',  # esperando, en_ronda, cuenta_regresiva, terminada
                'stop_solicitado_por': None
            }

        # Unirse al grupo de la sala
        await self.channel_layer.group_add(
            self.sala_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Abandonar el grupo de la sala
        await self.channel_layer.group_discard(
            self.sala_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        evento = data.get('action')

        if evento == 'iniciar_ronda':
            letra_elegida = data.get('letra', 'A')
            
            # 1. Forzamos la persistencia real en PostgreSQL antes de mover las pantallas
            await self.crear_ronda_en_postgres(self.sala_codigo, letra_elegida)

            # 2. Cambiamos el estado en la memoria volatil
            self.salas_activas[self.sala_codigo]['estado'] = 'en_ronda'
            
            # 3. Notificamos al grupo de React
            await self.channel_layer.group_send(
                self.sala_group_name,
                {
                    'type': 'notificar_inicio',
                    'letra': letra_elegida
                }
            )

        elif evento == 'presionar_stop':
            estado_actual = self.salas_activas[self.sala_codigo]['estado']
            
            # Solo permitir el Stop si la ronda está activamente en curso
            if estado_actual == 'en_ronda':
                self.salas_activas[self.sala_codigo]['estado'] = 'cuenta_regresiva'
                self.salas_activas[self.sala_codigo]['stop_solicitado_por'] = self.channel_name

                # 1. Avisar inmediatamente a todos que inició la cuenta regresiva de 10s
                await self.channel_layer.group_send(
                    self.sala_group_name,
                    {
                        'type': 'notificar_cuenta_regresiva',
                        'mensaje': '¡STOP! Quedan 10 segundos para terminar de escribir.'
                    }
                )

                # 2. Lanzamos el temporizador asíncrono no bloqueante nativo de asyncio
                asyncio.create_task(self.temporizador_congelar_pantalla_async())

    async def temporizador_congelar_pantalla_async(self):
        # Espera asíncrona perfecta de 10 segundos sin congelar el hilo del servidor daphne
        await asyncio.sleep(10)
        
        # Cambiar estado en memoria
        self.salas_activas[self.sala_codigo]['estado'] = 'terminada'

        # 3. Notificamos el congelamiento a React para que dispare los POSTs del formulario
        await self.channel_layer.group_send(
            self.sala_group_name,
            {
                'type': 'notificar_congelamiento',
                'mensaje': 'TIEMPO FUERA. Pantallas bloqueadas. Guardando respuestas...'
            }
        )

        # 4. Desactivamos la ronda en PostgreSQL un milisegundo después para dejar el registro cerrado
        await self.desactivar_ronda_en_postgres(self.sala_codigo)

    # --- Métodos de gestión de eventos enviados al grupo ---

    async def notificar_inicio(self, event):
        await self.send(text_data=json.dumps({
            'status': 'ronda_iniciada',
            'letra': event['letra']
        }))

    async def notificar_cuenta_regresiva(self, event):
        await self.send(text_data=json.dumps({
            'status': 'stop_presionado',
            'segundos_restantes': 10,
            'mensaje': event['mensaje']
        }))

    async def notificar_congelamiento(self, event):
        await self.send(text_data=json.dumps({
            'status': 'congelar_pantalla',
            'mensaje': event['mensaje']
        }))