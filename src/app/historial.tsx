import { StyleSheet, Text, View } from "react-native";

export default function HistorialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial médico</Text>
      <Text>Pantalla temporal del historial médico</Text>
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
});
