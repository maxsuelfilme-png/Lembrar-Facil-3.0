
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="idoso" />
        <Stack.Screen name="familia" />
        <Stack.Screen name="receita" />
        <Stack.Screen name="medicamentos" />
        <Stack.Screen name="rotina" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}
