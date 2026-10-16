
import React from "react";

import {
  Image,
  StyleSheet,
  View,
} from "react-native";

import { StatusBar } from "expo-status-bar";

export default function AberturaScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Image
        source={require("../../assets/images/splash-lembrafacil.png")}
        style={styles.imagem}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FFFA",
    justifyContent: "center",
    alignItems: "center",
  },

  imagem: {
    width: "100%",
    height: "100%",
  },
});
