
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />

        <Stack.Screen name="login" />
        <Stack.Screen name="idoso" />
        <Stack.Screen name="familia" />

        <Stack.Screen name="receita" />
        <Stack.Screen name="medicamentos" />
        <Stack.Screen name="rotina" />

        <Stack.Screen name="farmacia-login" />
        <Stack.Screen name="farmacia-cadastro" />
        <Stack.Screen name="farmacia-painel" />

        <Stack.Screen name="farmacias" />
        <Stack.Screen name="farmacias-busca" />
        <Stack.Screen name="farmacias-mapa" />
        <Stack.Screen name="farmacias-reposicao" />

        <Stack.Screen name="explore" />
      </Stack>
    </>
  );
}
