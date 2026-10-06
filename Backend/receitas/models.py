from django.db import models
from django.contrib.auth.models import User


class Receita(models.Model):
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='receitas'
    )

    imagem = models.ImageField(
        upload_to='receitas/',
        null=True,
        blank=True
    )

    texto_ocr = models.TextField(
        blank=True
    )

    medico = models.CharField(
        max_length=150,
        blank=True
    )

    observacao = models.TextField(
        blank=True
    )

    criada_em = models.DateTimeField(
        auto_now_add=True
    )

    atualizada_em = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f'Receita {self.id} - {self.usuario.username}'