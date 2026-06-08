import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getFinanceByDays, getPayments } from "../../services/api";

export default function FinanceScreen() {
  const [tab, setTab] = useState("payments");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res =
        tab === "payments" ? await getPayments() : await getFinanceByDays();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tab]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === "payments" && styles.activeTab]}
          onPress={() => setTab("payments")}
        >
          <Text style={tab === "payments" ? styles.activeText : styles.text}>
            Платежи
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "cashflow" && styles.activeTab]}
          onPress={() => setTab("cashflow")}
        >
          <Text style={tab === "cashflow" ? styles.activeText : styles.text}>
            Движение
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {tab === "payments"
            ? // Рендер таблицы платежей
              data.map((item, i) => (
                <View key={i} style={styles.row}>
                  <View>
                    <Text style={styles.bold}>{item.client}</Text>
                    <Text style={styles.sm}>{item.orderDate}</Text>
                  </View>
                  <Text style={styles.green}>
                    +{Number(item.amount).toLocaleString()} сом
                  </Text>
                </View>
              ))
            : // Рендер таблицы движения средств
              Object.keys(data).map((date) => (
                <View key={date} style={styles.row}>
                  <Text style={styles.bold}>{date}</Text>
                  <Text style={styles.green}>
                    {console.log('first', data)}
                    +{Number(data[date].income || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.red}>
                    -{Number(data[date].expense || 0).toLocaleString()}
                  </Text>
                </View>
              ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8", paddingTop: 50 },
  tabBar: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    padding: 4,
  },
  tab: { flex: 1, padding: 12, alignItems: "center", borderRadius: 10 },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  activeText: { fontWeight: "700", color: "#22c55e" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  bold: { fontWeight: "700" },
  green: { color: "#22c55e", fontWeight: "600" },
  red: { color: "#e11d48", fontWeight: "600" },
  sm: { fontSize: 12, color: "#64748b" },
});
