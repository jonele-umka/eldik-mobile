import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Оборачиваем в ScrollView на случай маленьких экранов */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Главное действие: Новый заказ */}
        <View style={styles.mainActionContainer}>
          <TouchableOpacity
            style={styles.mainTile}
            onPress={() => router.push("/details/createOrder")}
          >
            <Text style={styles.tileEmoji}>📝</Text>
            <View style={styles.mainTileTextContainer}>
              <Text style={styles.tileTitle}>Оформить новый заказ</Text>
              <Text style={styles.tileDesc}>
                Выбрать клиента, рынок и собрать коробки
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Разделитель / Заголовок для остальных разделов */}
        <Text style={styles.sectionTitle}>Быстрый доступ</Text>

        {/* Сетка 2х2 для бывших пунктов бургер-меню */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.subTile}
            onPress={() => router.push("/homeScreen/clientsScreen")}
          >
            <Text style={styles.subTileEmoji}>👥</Text>
            <Text style={styles.subTileTitle}>База клиентов</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subTile}
            onPress={() => router.push("/homeScreen/expensesScreen")}
          >
            <Text style={styles.subTileEmoji}>💸</Text>
            <Text style={styles.subTileTitle}>Расходы</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subTile}
            onPress={() => router.push("/homeScreen/debtorsScreen")}
          >
            <Text style={styles.subTileEmoji}>📉</Text>
            <Text style={styles.subTileTitle}>Должники</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  scrollContent: { paddingBottom: 30 },

  // Главная кнопка заказа
  mainActionContainer: { paddingHorizontal: 16, marginTop: 20 },
  mainTile: {
    backgroundColor: "#22c55e",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tileEmoji: { fontSize: 32, marginRight: 16 },
  mainTileTextContainer: { flex: 1 },
  tileTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  tileDesc: { fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
  },

  // Сетка маленьких кнопок 2х2
  grid: {
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  subTile: {
    backgroundColor: "#fff",
    width: "47%", // Чуть меньше половины экрана для отступов
    aspectRatio: 1.2, // Делает карточки аккуратными прямоугольниками
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    marginHorizontal: "1.5%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  subTileEmoji: { fontSize: 26, marginBottom: 8 },
  subTileTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },

  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  infoText: { fontSize: 13, color: "#666", lineHeight: 18 },
});
