import random
import string
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.db.models import Max
from django.core.cache import cache  # 🚀 Importante: para validar estados en tiempo real sin latencia

from .models import Sala, PerfilUsuario, Ronda, RespuestaJugador, SalaJugador
from .serializers import (
    RegistroUsuarioSerializer, 
    SalaSerializer, 
    RespuestaJugadorSerializer, 
    PerfilUsuarioSerializer, 
    RondaSerializer
)

# ==========================================
# 1. REGISTRO Y AUTENTICACIÓN
# ==========================================

class RegistroUsuarioView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegistroUsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"mensaje": "Usuario y perfil creados con éxito."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


class PerfilUsuarioDetalleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        print(f"🕵️‍♂️ Solicitando perfil: {request.user.username}")
        try:
            perfil = request.user.perfil
            serializer = PerfilUsuarioSerializer(perfil)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PerfilUsuario.DoesNotExist:
            print("❌ ERROR: Usuario sin perfil.")
            return Response(
                {"error": "El usuario no tiene un perfil asociado."}, 
                status=status.HTTP_404_NOT_FOUND
            )


# ==========================================
# 2. GESTIÓN DE SALAS (LOBBY)
# ==========================================

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

        SalaJugador.objects.create(sala=sala, jugador=perfil, listo=True)

        serializer = SalaSerializer(sala)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DetalleSalaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, codigo_sala):
        try:
            sala = Sala.objects.select_related('creador__usuario').prefetch_related(
                'jugadores',
                'rondas',
                'rondas__respuestas',
                'rondas__respuestas__jugador__usuario'
            ).get(codigo=codigo_sala.upper())

            serializer = SalaSerializer(sala)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Sala.DoesNotExist:
            return Response({"error": "La sala solicitada no existe."}, status=status.HTTP_404_NOT_FOUND)


class UnirseSalaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, codigo_sala):
        try:
            perfil = request.user.perfil
        except PerfilUsuario.DoesNotExist:
            return Response({"error": "Perfil de usuario no válido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sala = Sala.objects.select_related('creador').get(codigo=codigo_sala.upper())
        except Sala.DoesNotExist:
            return Response({"error": "El código PIN de sala no existe."}, status=status.HTTP_404_NOT_FOUND)

        if sala.estado != 'esperando':
            return Response({"error": "La partida ya comenzó o la sala está cerrada."}, status=status.HTTP_400_BAD_REQUEST)

        _, creado = SalaJugador.objects.get_or_create(sala=sala, jugador=perfil)
        if not creado:
            return Response({"mensaje": "Ya eres miembro de esta sala."}, status=status.HTTP_200_OK)

        serializer = SalaSerializer(sala)
        return Response({
            "mensaje": f"Te has unido exitosamente a la sala {sala.codigo}.",
            "sala": serializer.data
        }, status=status.HTTP_200_OK)


# ==========================================
# 3. DINÁMICA DE JUEGO Y EVALUACIÓN
# ==========================================

class GuardarRespuestaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, codigo_sala):
        print("\n" + "= "*50)
        print("📥 [LOG BACKEND] Petición recibida para guardar respuestas")
        print(f"🔑 Código de Sala: '{codigo_sala}'")
        print(f"👤 Jugador: {request.user.username}")
        print("= "*50)

        if not codigo_sala or len(codigo_sala) != 6:
            return Response({"error": "Código de sala inválido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            try:
                perfil = request.user.perfil
            except PerfilUsuario.DoesNotExist:
                return Response({"error": "Perfil no encontrado."}, status=status.HTTP_400_BAD_REQUEST)

            # 🛡️ SOLUCIÓN 1: Cruzar datos con la caché asíncrona distribuida
            codigo_upper = codigo_sala.upper()
            room_state = cache.get(f"ztop_sala:{codigo_upper}", {})
            estado_actual = room_state.get('estado', 'en_ronda')

            # Si el WebSocket ya está evaluando o la sala cerró, bloqueamos ráfagas tardías por lag
            if estado_actual in ['evaluacion', 'terminada']:
                print(f"❌ [BLOQUEADO] Intento de guardar inputs fuera de tiempo. Estado: {estado_actual}")
                return Response({
                    "error": "Tiempo agotado. La ronda está en proceso de evaluación o ya terminó."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Buscar la ronda activa más reciente
            ronda = Ronda.objects.filter(sala__codigo=codigo_upper, activa=True).order_by('-id').first()
            
            if not ronda:
                return Response({
                    "error": f"No hay una ronda activa en la sala {codigo_upper}."
                }, status=status.HTTP_404_NOT_FOUND)

            # Obtener o crear el registro de respuestas del usuario móvil
            respuesta_instancia, creado = RespuestaJugador.objects.get_or_create(ronda=ronda, jugador=perfil)

            serializer = RespuestaJugadorSerializer(respuesta_instancia, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                print("🚀 [ÉXITO] Respuestas móviles almacenadas transitoriamente.")
                return Response({
                    "mensaje": "Respuestas guardadas correctamente.",
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("\n💥 [CRASH GUARDAR RESPUESTA]")
            traceback.print_exc()
            return Response({"error": "Error interno del servidor.", "detalle": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResultadosRondaView(APIView):
    """Retorna los resultados unificados con el payload exacto del WebSocket."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, codigo_sala):
        try:
            sala = Sala.objects.get(codigo=codigo_sala.upper())
            ultima_ronda = Ronda.objects.filter(sala=sala).order_by('-id').first()
            
            if not ultima_ronda:
                return Response({"mensaje": "No hay rondas registradas.", "resultados": []}, status=status.HTTP_200_OK)
            
            respuestas = RespuestaJugador.objects.filter(
                ronda=ultima_ronda
            ).select_related('jugador__usuario').order_by('-total_puntos_ronda')
            
            # 🎯 SOLUCIÓN 3: Estructura idéntica y anidada para evitar caídas en React
            resultados = []
            for resp in respuestas:
                resultados.append({
                    'jugador': resp.jugador.username,
                    'puntaje_total_acumulado': resp.jugador.puntaje_total,
                    'total_ronda': resp.total_puntos_ronda or 0,
                    'detalles': {
                        'nombre': {'valor': resp.nombre or '-', 'pts': resp.puntos_nombre},
                        'apellido': {'valor': resp.apellido or '-', 'pts': resp.puntos_apellido},
                        'ciudad_pais': {'valor': resp.ciudad_pais or '-', 'pts': resp.puntos_ciudad_pais},
                        'animal': {'valor': resp.animal or '-', 'pts': resp.puntos_animal},
                        'cosa': {'valor': resp.cosa or '-', 'pts': resp.puntos_cosa}
                    }
                })
            
            return Response({
                "ronda_id": ultima_ronda.id,
                "numero_ronda": ultima_ronda.numero_ronda,
                "letra": ultima_ronda.letra,
                "resultados": resultados
            }, status=status.HTTP_200_OK)
            
        except Sala.DoesNotExist:
            return Response({"error": "Sala no encontrada."}, status=status.HTTP_404_NOT_FOUND)