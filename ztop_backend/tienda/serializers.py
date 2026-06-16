from rest_framework import serializers
from .models import ItemCosmetico, Monedero

class ItemCosmeticoSerializer(serializers.ModelSerializer):
    comprado = serializers.SerializerMethodField()
    desbloqueado_por_nivel = serializers.SerializerMethodField()

    class Meta:
        model = ItemCosmetico
        fields = ['id', 'nombre', 'seed', 'categoria', 'precio', 'nivel_requerido', 'comprado', 'desbloqueado_por_nivel']

    def get_comprado(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                inventario = request.user.perfil.inventario
                return inventario.items_desbloqueados.filter(id=obj.id).exists()
            except:
                return False
        return False

    def get_desbloqueado_por_nivel(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            perfil = request.user.perfil
            # Calculamos el nivel igual que en el frontend
            nivel_actual = (perfil.puntaje_total // 500) + 1
            return nivel_actual >= obj.nivel_requerido
        return False

class MonederoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Monedero
        fields = ['monedas']