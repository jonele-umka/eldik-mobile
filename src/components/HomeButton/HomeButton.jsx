import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function HomeButton() {
  return (
    <TouchableOpacity style={styles.button} onPress={() => router.replace("/")}>
      <Text style={styles.text}>🏠 Главная</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
