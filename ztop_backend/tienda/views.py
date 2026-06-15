from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from juego.models import PerfilUsuario
from .models import ItemCosmetico, Monedero, InventarioCosmetico
from .serializers import ItemCosmeticoSerializer

class CatalogoTiendaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = request.user.perfil
        
        # Aseguramos de forma segura que el usuario tenga un monedero e inventario creados
        monedero, _ = Monedero.objects.get_or_create(perfil=perfil)
        InventarioCosmetico.objects.get_or_create(perfil=perfil)
        
        items = ItemCosmetico.objects.all().order_by('precio')
        serializer = ItemCosmeticoSerializer(items, many=True, context={'request': request})
        
        return Response({
            "saldo": monedero.monedas,
            "catalogo": serializer.data
        })

class ComprarItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        perfil = request.user.perfil
        
        try:
            item = ItemCosmetico.objects.get(id=item_id)
            monedero = perfil.monedero
            inventario = perfil.inventario
            
            if inventario.items_desbloqueados.filter(id=item.id).exists():
                return Response({"error": "Ya tienes comprado este cosmético."}, status=status.HTTP_400_BAD_REQUEST)
                
            if monedero.monedas < item.precio:
                return Response({"error": "Monedas insuficientes."}, status=status.HTTP_400_BAD_REQUEST)
                
            with transaction.atomic():
                monedero.monedas -= item.precio
                monedero.save()
                inventario.items_desbloqueados.add(item)
                
            return Response({"status": "ok", "saldo": monedero.monedas, "mensaje": f"¡Compraste {item.nombre}!"})
            
        except ItemCosmetico.DoesNotExist:
            return Response({"error": "El cosmético no existe."}, status=status.HTTP_404_NOT_FOUND)

class EquiparItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        perfil = request.user.perfil
        try:
            item = ItemCosmetico.objects.get(id=item_id)
            inventario = perfil.inventario
            
            if not inventario.items_desbloqueados.filter(id=item.id).exists():
                return Response({"error": "No has desbloqueado este cosmético aún."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Formateamos dinámicamente la URL de DiceBear según su categoría y semilla
            nueva_url = f"https://api.dicebear.com/7.x/{item.categoria}/svg?seed={item.seed}"
            perfil.avatar_url = nueva_url
            perfil.save()
            
            return Response({"status": "ok", "nueva_url": nueva_url, "mensaje": "Avatar equipado correctamente."})
            
        except ItemCosmetico.DoesNotExist:
            return Response({"error": "El cosmético no existe."}, status=status.HTTP_404_NOT_FOUND)