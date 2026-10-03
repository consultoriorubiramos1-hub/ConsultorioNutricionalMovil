import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function InicioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio</Text>
      <Text style={styles.subtitle}>Navegación temporal</Text>

      <Pressable style={styles.button} onPress={() => router.push("/muro")}>
        <Text>Muro</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/citas")}>
        <Text>Citas</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/historial")}
      >
        <Text>Historial médico</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/plan-alimenticio")}
      >
        <Text>Plan alimenticio</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/perfil")}>
        <Text>Perfil</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.replace("/login")}>
        <Text>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: 20,
  },
  button: {
    width: "100%",
    maxWidth: 300,
    padding: 14,
    marginVertical: 5,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
});
