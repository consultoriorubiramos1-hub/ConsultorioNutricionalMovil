import { StyleSheet, Text, View } from "react-native";

export default function PlanAlimenticioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan alimenticio</Text>
      <Text>Pantalla temporal del plan alimenticio</Text>
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
