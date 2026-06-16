from django.urls import path
from .views import CatalogoTiendaView, ComprarItemView, EquiparItemView, MisAvataresView

urlpatterns = [
    path('', CatalogoTiendaView.as_view(), name='catalogo_tienda'),
    path('comprar/<int:item_id>/', ComprarItemView.as_view(), name='comprar_item'),
    path('equipar/<int:item_id>/', EquiparItemView.as_view(), name='equipar_item'),
    path('mis-avatares/', MisAvataresView.as_view(), name='mis_avatares'), 
]