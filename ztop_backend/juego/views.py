import random
import string
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import Sala, PerfilUsuario, Ronda, RespuestaJugador
from .serializers import RegistroUsuarioSerializer, SalaSerializer, RespuestaJugadorSerializer

# 1. Endpoint para Registrar un Usuario (User + Perfil)
class RegistroUsuarioView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroUsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"mensaje": "Usuario y perfil creados con éxito."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 2. Endpoint para Login (Retorna el Token para la App Móvil)
class LoginUsuarioView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username,
                "mensaje": "Sesión iniciada correctamente."
            }, status=status.HTTP_200_OK)
        return Response({"error": "Credenciales inválidas, intenta nuevamente."}, status=status.HTTP_401_UNAUTHORIZED)


# 3. Endpoint para Crear una Nueva Sala de Juego (Lobby)
class CrearSalaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            perfil = request.user.perfil
        except PerfilUsuario.DoesNotExist:
            return Response({"error": "El usuario no tiene un perfil configurado."}, status=status.HTTP_400_BAD_REQUEST)

        while True:
            codigo_sala = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Sala.objects.filter(codigo=codigo_sala).exists():
                break

        sala = Sala.objects.create(
            codigo=codigo_sala,
            creador=perfil,
            estado='esperando'
        )

        serializer = SalaSerializer(sala)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# 4. Endpoint para Detalle u Obtención de una Sala Existente
class DetalleSalaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, codigo_sala):
        try:
            sala = Sala.objects.get(codigo=codigo_sala.upper())
            serializer = SalaSerializer(sala)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Sala.DoesNotExist:
            return Response({"error": "La sala solicitada no existe en la base de datos."}, status=status.HTTP_404_NOT_FOUND)


# 5. Endpoint para que un Jugador se Una a un Lobby mediante PIN
class UnirseSalaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, codigo_sala):
        try:
            sala = Sala.objects.get(codigo=codigo_sala.upper())
            perfil = request.user.perfil
        except Sala.DoesNotExist:
            return Response({"error": "El código PIN de sala no existe."}, status=status.HTTP_404_NOT_FOUND)
        except PerfilUsuario.DoesNotExist:
            return Response({"error": "Perfil de usuario no válido."}, status=status.HTTP_400_BAD_REQUEST)

        if sala.estado != 'esperando':
            return Response({"error": "La partida ya comenzó o la sala está cerrada."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SalaSerializer(sala)
        return Response({
            "mensaje": f"Te has unido exitosamente a la sala {sala.codigo}.",
            "sala": serializer.data
        }, status=status.HTTP_200_OK)


# 6. Endpoint SOLUCIONADO: Guarda respuestas buscando la ronda más reciente de la sala
class GuardarRespuestaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, codigo_sala):
        print("\n" + "="*50)
        print("📥 [LOG BACKEND] Petición recibida para guardar respuestas")
        print(f"🔑 Código de Sala enviado por el cliente: '{codigo_sala}'")
        print(f"👤 Jugador: {request.user.username}")
        print(f"📦 Payload recibido: {request.data}")
        print("="*50)

        if not codigo_sala or codigo_sala.lower() == "undefined" or len(codigo_sala) != 6:
            print("❌ ERROR: El cliente envió un código de sala inválido o 'undefined'.")
            return Response({
                "error": "El estado de la sala no se sincronizó correctamente en el dispositivo."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Obtener Perfil asociado al Token
            try:
                perfil = request.user.perfil
            except PerfilUsuario.DoesNotExist:
                print("❌ ERROR: El usuario autenticado no tiene un PerfilUsuario creado.")
                return Response({"error": "Perfil de usuario no encontrado."}, status=status.HTTP_400_BAD_REQUEST)

            # 2. SOLUCIÓN: Buscamos la última ronda generada para esta sala (removiendo el candado estricto de activa=True)
            print(f"🔍 Buscando la ronda más reciente para la sala: '{codigo_sala.upper()}'...")
            rondas_match = Ronda.objects.filter(sala__codigo=codigo_sala.upper())
            print(f"📊 Cantidad total de rondas en esta sala: {rondas_match.count()}")
            
            if not rondas_match.exists():
                print(f"❌ ERROR: No se encontró ninguna ronda creada para la sala {codigo_sala.upper()}")
                return Response({
                    "error": f"No hay ninguna ronda registrada para la sala {codigo_sala.upper()}."
                }, status=status.HTTP_404_NOT_FOUND)

            # Tomamos la última ronda de la lista (la actual)
            ronda = rondas_match.latest('id')
            print(f"🎯 Última ronda localizada con éxito: ID {ronda.id} (Letra: '{ronda.letra}')")

            # 3. Validar que el juego no haya sido cerrado por completo
            if ronda.sala.estado == 'terminada':
                print("❌ ERROR: Intento de guardado en una sala cuyo estado general es 'terminada'.")
                return Response({"error": "El juego en esta sala ya finalizó."}, status=status.HTTP_400_BAD_REQUEST)

            # 4. Obtener o crear la fila de respuestas en PostgreSQL
            respuesta_instancia, creado = RespuestaJugador.objects.get_or_create(ronda=ronda, jugador=perfil)
            print(f"💾 Registro en Postgres: {'[NUEVO]' if creado else '[ACTUALIZAR]'} ID: {respuesta_instancia.id}")

            # 5. Guardar los textos validados parciales
            serializer = RespuestaJugadorSerializer(respuesta_instancia, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                print("🚀 [ÉXITO] ¡Respuestas persistidas correctamente en PostgreSQL!")
                print("="*50 + "\n")
                return Response({
                    "mensaje": "Respuestas guardadas correctamente en el servidor.",
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            
            print(f"❌ ERROR de validación del Serializador: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("\n💥 [CRASH INTERNO EN PROCESAMIENTO] 💥")
            print(f"Causa: {str(e)}")
            traceback.print_exc()
            print("="*50 + "\n")
            return Response({
                "error": "Ocurrió un error inesperado en el servidor.",
                "detalle": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)