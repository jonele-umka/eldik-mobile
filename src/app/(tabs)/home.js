import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { usePromo } from "../../context/PromoContext";
import AnalyticsScreen from "../homeScreen/AnalyticsScreen";
export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { promoEnabled, togglePromo } = usePromo();
  const analyticsRef = useRef(null);
  const insets = useSafeAreaInsets();
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    if (analyticsRef.current) {
      await analyticsRef.current.load();
    }

    setRefreshing(false);
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      {/* Оборачиваем в ScrollView на случай маленьких экранов */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity
          style={[
            styles.promoToggle,
            {
              backgroundColor: promoEnabled ? "#22c55e" : "#e9ecef",
              marginTop: insets.top + 10,
            },
          ]}
          onPress={togglePromo}
        >
          <Text
            style={[
              styles.promoToggleText,
              { color: promoEnabled ? "#fff" : "#666" },
            ]}
          >
            {promoEnabled
              ? "🎁 Акция активна: +1 за каждые 10"
              : "🎁 Акция выключена"}
          </Text>
        </TouchableOpacity>
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

        <Text style={styles.sectionTitle}>Быстрый доступ</Text>

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
          <TouchableOpacity
            style={styles.subTile}
            onPress={() => router.push("/homeScreen/notes")}
          >
            <Text style={styles.subTileEmoji}>📝</Text>
            <Text style={styles.subTileTitle}>Заметки</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.analyticsWrapper}>
          <AnalyticsScreen ref={analyticsRef} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { paddingBottom: 40 },
  analyticsWrapper: {
    paddingHorizontal: 16,
    marginTop: -10,
  },
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
  // Сетка 2х2
  grid: {
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 10, // Уменьшаем внутренний отступ снизу сетки
  },
  subTile: {
    backgroundColor: "#fff",
    width: "47%", // Чуть увеличим ширину, чтобы лучше заполнить пространство
    aspectRatio: 1.2, // Немного уменьшим высоту плитки (было 1.1)
    padding: 12, // Уменьшим padding внутри плитки
    borderRadius: 20,
    marginBottom: 12, // Снижаем отступ снизу
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  subTileEmoji: { fontSize: 28, marginBottom: 10 },
  subTileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  promoToggle: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  promoToggleText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
