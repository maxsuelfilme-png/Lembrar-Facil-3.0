
from django.contrib import admin
from .models import Farmacia, ProdutoFarmacia


@admin.register(Farmacia)
class FarmaciaAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "cnpj",
        "cidade",
        "estado",
        "faz_entrega",
        "parceira",
        "ativa",
    )

    search_fields = ("nome", "cnpj", "cidade")

    list_filter = (
        "estado",
        "faz_entrega",
        "parceira",
        "ativa",
    )


@admin.register(ProdutoFarmacia)
class ProdutoFarmaciaAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "farmacia",
        "preco",
        "quantidade_estoque",
        "disponivel",
    )

    search_fields = ("nome", "farmacia__nome")
