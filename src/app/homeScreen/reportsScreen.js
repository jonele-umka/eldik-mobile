import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchAnalyticsMonths } from "../../services/api";

const MONTHS = {
  "01": "Январь",
  "02": "Февраль",
  "03": "Март",
  "04": "Апрель",
  "05": "Май",
  "06": "Июнь",
  "07": "Июль",
  "08": "Август",
  "09": "Сентябрь",
  10: "Октябрь",
  11: "Ноябрь",
  12: "Декабрь",
};

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const data = await fetchAnalyticsMonths();
      console.log(JSON.stringify(data, null, 2));
      const result = data.map((item) => {
        const [year, month] = item.month.split("-");

        return {
          ...item,
          monthName: `${MONTHS[month] || month} ${year}`,
        };
      });

      setReports(result);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
          />
        }
      >
        <Text style={styles.pageTitle}>📈 История отчетов</Text>

        {reports.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.month}>📊 {item.monthName}</Text>
            <View style={styles.financeGrid}>
              <View style={styles.financeItem}>
                <Text style={styles.label}>Выручка</Text>
                <Text style={[styles.value, { color: "#27AE60" }]}>
                  {Number(item.revenue || 0).toLocaleString()} сом
                </Text>
              </View>

              <View style={styles.financeItem}>
                <Text style={styles.label}>Приход</Text>
                <Text style={[styles.value, { color: "#3498DB" }]}>
                  {Number(item.income || 0).toLocaleString()} сом
                </Text>
              </View>
            </View>

            <View style={styles.financeGrid}>
              <View style={styles.financeItem}>
                <Text style={styles.label}>Расход</Text>
                <Text style={[styles.value, { color: "#E67E22" }]}>
                  {Number(item.expense || 0).toLocaleString()} сом
                </Text>
              </View>

              <View style={styles.financeItem}>
                <Text style={styles.label}>Возврат</Text>
                <Text style={[styles.value, { color: "#E74C3C" }]}>
                  {Number(item.returns || 0).toLocaleString()} сом
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Прибыль</Text>
              <Text
                style={[
                  styles.value,
                  {
                    color: item.profit >= 0 ? "#27AE60" : "#E74C3C",
                  },
                ]}
              >
                {Number(item.profit || 0).toLocaleString()} сом
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.subtitle}>📦 Товары</Text>
            {(item.products || []).map((product, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemNumber}>{idx + 1}</Text>
                  <Text style={styles.itemName}>{product.name}</Text>
                </View>

                <Text style={styles.itemStats}>
                  {product.qty} шт • {Number(product.revenue).toLocaleString()}
                </Text>
              </View>
            ))}

            <Text style={styles.subtitle}>👥 Клиенты</Text>
            {(item.clients || []).map((client, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemNumber}>{idx + 1}</Text>
                  <Text style={styles.itemName}>{client.name}</Text>
                </View>

                <Text style={styles.itemStats}>
                  {client.orders} зак. •{" "}
                  {Number(client.revenue).toLocaleString()}
                </Text>
              </View>
            ))}

            <Text style={styles.subtitle}>🏪 Рынки</Text>
            {(item.marketAnalytics || []).map((market, idx) => (
              <View key={idx} style={styles.marketCard}>
                <View style={styles.marketHeader}>
                  <Text style={styles.marketTitle}>
                    {idx + 1}. {market.market}
                  </Text>
                </View>

                <View style={styles.marketGrid}>
                  <View style={styles.marketStatItem}>
                    <Text style={styles.label}>Выручка</Text>
                    <Text style={[styles.marketValue, { color: "#27AE60" }]}>
                      {Number(market.revenue || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.marketStatItem}>
                    <Text style={styles.label}>Прибыль</Text>
                    <Text
                      style={[
                        styles.marketValue,
                        {
                          color:
                            Number(market.profit) >= 0 ? "#27AE60" : "#E74C3C",
                        },
                      ]}
                    >
                      {Number(market.profit || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Дополнительные параметры в одну строку */}
                <View style={styles.marketFooter}>
                  <Text style={styles.miniStat}>
                    Приход:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {Number(market.income || 0).toLocaleString()}
                    </Text>
                  </Text>
                  <Text style={styles.miniStat}>
                    Расход:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {Number(market.expense || 0).toLocaleString()}
                    </Text>
                  </Text>
                  <Text style={styles.miniStat}>
                    Возврат:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {Number(market.returns || 0).toLocaleString()}
                    </Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24, // Более плавные углы
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEF0F3", // Легкая обводка вместо тени
  },
  month: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
  },
  financeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  financeItem: { flex: 1 },
  label: {
    fontSize: 12,
    color: "#95A5A6",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: { fontSize: 16, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F2F6", marginVertical: 20 },
  subtitle: {
    fontSize: 16,
    color: "#2D3436",
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 12,
  },
  // Контейнер для списков (товары/клиенты)
  listContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  itemNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B2BEC3",
    marginRight: 10,
    width: 24,
  },
  itemName: { fontSize: 14, color: "#2D3436", fontWeight: "600" },
  itemStats: { fontSize: 13, color: "#636E72", fontWeight: "500" },

  marketCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  marketHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D3436",
  },
  marketGrid: {
    flexDirection: "row",
    marginBottom: 12,
  },
  marketStatItem: {
    flex: 1,
  },
  marketValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  marketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#EDF2F7",
    padding: 8,
    borderRadius: 8,
  },
  miniStat: {
    fontSize: 11,
    color: "#4A5568",
  },
});
