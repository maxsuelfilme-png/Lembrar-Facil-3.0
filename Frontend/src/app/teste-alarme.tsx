
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";

import {
  verificarAlarmeAndroid,
  verificarPermissaoAlarme,
  solicitarPermissaoAlarme,
  agendarAlarmeMedicamento,
  cancelarAlarmeMedicamento,
} from "../services/alarmService";

const ID_TESTE = 987654;

export default function TesteAlarmeScreen() {
  const [resultado, setResultado] = useState(
    "Aguardando teste..."
  );

  async function verificarModulo() {
    try {
      const resposta = await verificarAlarmeAndroid();
      setResultado(resposta);
      Alert.alert("Módulo Android", resposta);
    } catch (erro) {
      Alert.alert("Erro", String(erro));
    }
  }

  async function verificarPermissao() {
    try {
      const permitido = await verificarPermissaoAlarme();

      setResultado(
        permitido
          ? "Permissão de alarme concedida"
          : "Permissão de alarme não concedida"
      );

      if (!permitido) {
        Alert.alert(
          "Permissão necessária",
          "Autorize alarmes exatos nas configurações do Android."
        );
      }
    } catch (erro) {
      Alert.alert("Erro", String(erro));
    }
  }

  async function solicitarPermissao() {
    try {
      const permitido = await solicitarPermissaoAlarme();

      if (permitido) {
        setResultado("Permissão já concedida");
      } else {
        setResultado(
          "Configurações abertas. Autorize e volte ao aplicativo."
        );
      }
    } catch (erro) {
      Alert.alert("Erro", String(erro));
    }
  }

  async function testarDespertador() {
    try {
      const permitido = await verificarPermissaoAlarme();

      if (!permitido) {
        Alert.alert(
          "Permissão necessária",
          "Primeiro autorize alarmes exatos."
        );
        return;
      }

      const data = new Date(
        Date.now() + 2 * 60 * 1000
      );

      const horario = data.toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      await agendarAlarmeMedicamento(
        ID_TESTE,
        "Medicamento de teste",
        horario,
        data
      );

      setResultado(
        `Despertador agendado para ${horario}`
      );

      Alert.alert(
        "Alarme agendado",
        `O despertador deverá disparar às ${horario}.`
      );
    } catch (erro) {
      Alert.alert("Erro", String(erro));
    }
  }

  async function cancelarTeste() {
    try {
      await cancelarAlarmeMedicamento(ID_TESTE);

      setResultado("Agendamento de teste cancelado");

      Alert.alert(
        "Cancelado",
        "O alarme agendado foi cancelado."
      );
    } catch (erro) {
      Alert.alert("Erro", String(erro));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>
        LembraFácil
      </Text>

      <Text style={styles.subtitulo}>
        Teste do despertador Android
      </Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={verificarModulo}
      >
        <Text style={styles.textoBotao}>
          Verificar módulo Android
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botao}
        onPress={verificarPermissao}
      >
        <Text style={styles.textoBotao}>
          Verificar permissão
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botao}
        onPress={solicitarPermissao}
      >
        <Text style={styles.textoBotao}>
          Solicitar permissão
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botaoPrincipal}
        onPress={testarDespertador}
      >
        <Text style={styles.textoBotao}>
          Testar alarme em 2 minutos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botaoCancelar}
        onPress={cancelarTeste}
      >
        <Text style={styles.textoBotao}>
          Cancelar teste
        </Text>
      </TouchableOpacity>

      <View style={styles.resultado}>
        <Text style={styles.resultadoTexto}>
          {resultado}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5FFFA",
    padding: 24,
    justifyContent: "center",
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#166534",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 18,
    textAlign: "center",
    color: "#475569",
    marginBottom: 32,
  },
  botao: {
    backgroundColor: "#15803D",
    padding: 17,
    borderRadius: 12,
    marginBottom: 12,
  },
  botaoPrincipal: {
    backgroundColor: "#166534",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  botaoCancelar: {
    backgroundColor: "#B91C1C",
    padding: 17,
    borderRadius: 12,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  resultado: {
    marginTop: 24,
    padding: 18,
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
  },
  resultadoTexto: {
    color: "#14532D",
    textAlign: "center",
    fontSize: 15,
  },
});
