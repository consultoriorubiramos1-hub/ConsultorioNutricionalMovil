import { StyleSheet, Text, View } from "react-native";

export default function MuroScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muro</Text>
      <Text>Pantalla temporal del muro informativo</Text>
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
