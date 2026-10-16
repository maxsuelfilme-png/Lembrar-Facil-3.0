
import React, { useEffect } from "react";

import {
  Image,
  StyleSheet,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Abertura() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

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
