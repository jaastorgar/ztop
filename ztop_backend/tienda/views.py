from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from .models import ItemCosmetico, Monedero, InventarioCosmetico
from .serializers import ItemCosmeticoSerializer

class CatalogoTiendaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = request.user.perfil
        
        monedero, _ = Monedero.objects.get_or_create(perfil=perfil)
        InventarioCosmetico.objects.get_or_create(perfil=perfil)
        
        # 🚀 SOLUCIÓN: Filtramos para que SOLO salgan los que cuestan dinero (precio mayor a 0)
        items = ItemCosmetico.objects.filter(precio__gt=0).order_by('precio')
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
            
            # Validamos si su nivel ya supera el requisito para no cobrarle de más
            nivel_actual = (perfil.puntaje_total // 500) + 1
            if nivel_actual >= item.nivel_requerido:
                return Response({"error": "Ya tienes este avatar gratis por tu nivel."}, status=status.HTTP_400_BAD_REQUEST)

            if inventario.items_desbloqueados.filter(id=item.id).exists():
                return Response({"error": "Ya compraste este cosmético."}, status=status.HTTP_400_BAD_REQUEST)
                
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
            inventario, _ = InventarioCosmetico.objects.get_or_create(perfil=perfil)
            
            nivel_actual = (perfil.puntaje_total // 500) + 1
            es_valido_por_nivel = nivel_actual >= item.nivel_requerido
            es_valido_por_compra = inventario.items_desbloqueados.filter(id=item.id).exists()
            
            # El usuario puede equipárselo si cumple CUALQUIERA de las dos condiciones
            if not (es_valido_por_nivel or es_valido_por_compra):
                return Response({"error": f"Bloqueado. Requiere nivel {item.nivel_requerido} o comprarlo."}, status=status.HTTP_400_BAD_REQUEST)
            
            # 🚀 SOLUCIÓN: Usamos la API de Minotar para Minecraft o DiceBear para el resto
            if item.categoria == 'minecraft':
                nueva_url = f"https://minotar.net/helm/{item.seed}/150.png"
            else:
                nueva_url = f"https://api.dicebear.com/7.x/{item.categoria}/svg?seed={item.seed}"
            
            perfil.avatar_url = nueva_url
            perfil.save()
            
            return Response({"status": "ok", "nueva_url": nueva_url, "mensaje": "¡Avatar equipado!"})
            
        except ItemCosmetico.DoesNotExist:
            return Response({"error": "El cosmético no existe."}, status=status.HTTP_404_NOT_FOUND)

class MisAvataresView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = ItemCosmetico.objects.all().order_by('nivel_requerido')
        serializer = ItemCosmeticoSerializer(items, many=True, context={'request': request})
        
        # Filtramos y devolvemos exclusivamente los que están desbloqueados o comprados
        unlocked_items = [
            x for x in serializer.data 
            if x['comprado'] or x['desbloqueado_por_nivel']
        ]
        return Response(unlocked_items)