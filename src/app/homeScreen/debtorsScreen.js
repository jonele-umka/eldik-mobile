import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CLIENTS from "../../constants/clients"; // Импортируем для поиска связи клиент -> рынок
import MARKETS from "../../constants/markets"; // Импортируем массив рынков
import { getDebtors } from "../../services/api";

export default function DebtorsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedDebtors, setGroupedDebtors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getDebtors();

      // 1. Фильтруем только должников и сортируем по убыванию суммы долга
      const onlyDebtors = data
        .filter((item) => Number(item.debt) > 0)
        .sort((a, b) => Number(b.debt) - Number(a.debt));

      // 2. Инициализируем группы на основе официального массива MARKETS
      const grouped = {};
      MARKETS.forEach((marketName) => {
        grouped[marketName] = [];
      });
      // Для клиентов, чей рынок определить не удалось
      grouped["Другие рынки"] = [];

      // 3. Распределяем должников по рынкам, используя структуру CLIENTS
      onlyDebtors.forEach((item) => {
        // Ищем, к какому рынку принадлежит данный клиент в constants/clients.js
        let foundMarket = "Другие рынки";

        for (const [marketName, clientList] of Object.entries(CLIENTS)) {
          if (clientList.includes(item.client)) {
            foundMarket = marketName;
            break;
          }
        }

        // Добавляем должника в соответствующую группу
        grouped[foundMarket].push(item);
      });

      setGroupedDebtors(grouped);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  // Выводим только те рынки, где реально есть хотя бы один должник
  const marketsToRender = Object.keys(groupedDebtors).filter(
    (marketName) => groupedDebtors[marketName].length > 0
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#1a1a1a"]}
          tintColor="#1a1a1a"
        />
      }
    >
      <Text style={styles.title}>Должники</Text>

      {marketsToRender.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🎉 Отлично! Должников пока нет.</Text>
        </View>
      ) : (
        marketsToRender.map((marketName) => (
          <View key={marketName} style={styles.marketSection}>
            {/* Красивый заголовок рынка */}
            <Text style={styles.marketHeaderTitle}>📍 {marketName}</Text>

            {/* Список должников внутри конкретного рынка */}
            {groupedDebtors[marketName].map((item, index) => (
              <View key={index} style={[styles.card, styles.activeDebtCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>👤 {item.client}</Text>
                  <Text style={styles.miniDebtBadge}>
                    -{Number(item.debt).toLocaleString()} c.
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📦 Заказано:</Text>
                  <Text style={styles.infoValue}>
                    {Number(item.ordered).toLocaleString()} сом
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🔄 Возвраты:</Text>
                  <Text style={styles.infoValue}>
                    {Number(item.returns).toLocaleString()} сом
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>💵 Оплачено:</Text>
                  <Text style={styles.infoValue}>
                    {Number(item.paid).toLocaleString()} сом
                  </Text>
                </View>

                <View style={[styles.infoRow, styles.debtRow]}>
                  <Text style={styles.debtLabel}>Остаток долга:</Text>
                  <Text style={[styles.debtValue, styles.textRed]}>
                    {Number(item.debt).toLocaleString()} сом
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 60,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  marketSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  marketHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  activeDebtCard: {
    borderColor: "#fee2e2",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
    paddingBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  miniDebtBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  debtRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    marginTop: 10,
    paddingTop: 10,
    marginBottom: 0,
  },
  debtLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  debtValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  textRed: {
    color: "#ef4444",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22c55e",
  },
  spacer: {
    height: 40,
  },
});