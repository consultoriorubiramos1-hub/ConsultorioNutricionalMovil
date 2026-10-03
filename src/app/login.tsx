import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio de sesión</Text>
      <Text>Pantalla temporal de autenticación</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.replace("/inicio")}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
  },
});
