from rest_framework import serializers
from .models import ItemCosmetico, Monedero

class ItemCosmeticoSerializer(serializers.ModelSerializer):
    comprado = serializers.SerializerMethodField()

    class Meta:
        model = ItemCosmetico
        fields = ['id', 'nombre', 'seed', 'categoria', 'precio', 'comprado']

    def get_comprado(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                inventario = request.user.perfil.inventario
                return inventario.items_desbloqueados.filter(id=obj.id).exists()
            except:
                return False
        return False

class MonederoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Monedero
        fields = ['monedas']