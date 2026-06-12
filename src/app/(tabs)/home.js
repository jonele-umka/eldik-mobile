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
import AnalyticsScreen from "../homeScreen/AnalyticsScreen";

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
          <TouchableOpacity
            style={styles.subTile}
            onPress={() => router.push("/homeScreen/reportsScreen")}
          >
            <Text style={styles.subTileEmoji}>📈</Text>
            <Text style={styles.subTileTitle}>Отчеты</Text>
          </TouchableOpacity>
        </View>
        <AnalyticsScreen />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" }, // Более мягкий фон
  scrollContent: { paddingBottom: 40 },

  // Главная кнопка заказа
  mainActionContainer: { paddingHorizontal: 16, marginTop: 24 },
  mainTile: {
    backgroundColor: "#22c55e",
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  tileEmoji: { fontSize: 36, marginRight: 16 },
  mainTileTextContainer: { flex: 1 },
  tileTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  tileDesc: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 4 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginLeft: 16,
    marginTop: 32,
    marginBottom: 16,
  },

  // Сетка 2х2
  grid: {
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  subTile: {
    backgroundColor: "#fff",
    width: "46%",
    aspectRatio: 1.1,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  subTileEmoji: { fontSize: 28, marginBottom: 10 },
  subTileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});
