
from django.conf import settings
from django.db import models


class Farmacia(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="farmacia"
    )

    nome = models.CharField(max_length=150)

    cnpj = models.CharField(
        max_length=14,
        unique=True
    )

    telefone = models.CharField(max_length=20)

    whatsapp = models.CharField(
        max_length=20,
        blank=True
    )

    endereco = models.CharField(max_length=255)
    cidade = models.CharField(max_length=100)
    estado = models.CharField(max_length=2)
    cep = models.CharField(max_length=8)

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    horario_funcionamento = models.TextField(
        blank=True
    )

    faz_entrega = models.BooleanField(default=False)

    taxa_entrega = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True
    )

    ativa = models.BooleanField(default=True)

    parceira = models.BooleanField(default=False)

    criada_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome


class ProdutoFarmacia(models.Model):
    farmacia = models.ForeignKey(
        Farmacia,
        on_delete=models.CASCADE,
        related_name="produtos"
    )

    nome = models.CharField(max_length=150)

    descricao = models.TextField(blank=True)

    preco = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    quantidade_estoque = models.PositiveIntegerField(
        default=0
    )

    disponivel = models.BooleanField(default=True)

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nome} - {self.farmacia.nome}"
