import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchFinanceReport } from "../../services/api";

export default function FinanceScreen() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFinance();
  }, []);

  async function loadFinance() {
    try {
      const res = await fetchFinanceReport();
      setData(res || {});
    } catch (e) {
      console.log("Finance error:", e);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetchFinanceReport();
      setData(res || {});
    } catch (e) {
      console.log("Refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  function getMonthName(monthKey) {
    const months = {
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
    const [year, month] = monthKey.split("-");
    return `${months[month]} ${year}`;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.screenTitle}>Финансы</Text>
        {Object.keys(data).length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.noDataText}>Данные не найдены</Text>
          </View>
        ) : (
          Object.keys(data)
            .sort()
            .reverse()
            .map((month) => {
              const monthData = data[month];
              let totalVolume = 0,
                totalIncome = 0,
                totalExpense = 0,
                totalReturns = 0;

              Object.keys(monthData).forEach((day) => {
                totalVolume += monthData[day].totalVolume || 0;
                totalIncome += monthData[day].income || 0;
                totalExpense += monthData[day].expense || 0;
                totalReturns += monthData[day].returns || 0;
              });

              const finalVolume = totalVolume - totalReturns - totalExpense;

              const balance = totalIncome - totalExpense - totalReturns;

              return (
                <View key={month} style={styles.monthBlock}>
                  <Text style={styles.monthTitle}>{getMonthName(month)}</Text>

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>Объем</Text>
                      <Text style={styles.value}>
                        {totalVolume.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>Доходы</Text>
                      <Text style={[styles.value, { color: "#16a34a" }]}>
                        {totalIncome.toLocaleString()} сом
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>Расходы</Text>
                      <Text style={[styles.value, { color: "#dc2626" }]}>
                        {totalExpense.toLocaleString()} сом
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>Возврат</Text>
                      <Text style={[styles.value, { color: "#d97706" }]}>
                        {totalReturns.toLocaleString()} сом
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>Чистый объем</Text>
                      <Text style={[styles.value, { color: "#7c3aed" }]}>
                        {finalVolume.toLocaleString()} сом
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Баланс</Text>
                      <Text
                        style={[
                          styles.totalValue,
                          balance < 0 && styles.negativeBalance,
                        ]}
                      >
                        {balance.toLocaleString()} сом
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tableCard}>
                    <View style={styles.header}>
                      <Text style={[styles.headerText, { flex: 0.8 }]}>
                        Дата
                      </Text>
                      <Text style={styles.headerText}>Объем</Text>
                      <Text style={styles.headerText}>Дох.</Text>
                      <Text style={styles.headerText}>Расх.</Text>
                      <Text style={styles.headerText}>Возв.</Text>
                    </View>

                    {Object.keys(monthData)
                      .sort()
                      .reverse()
                      .map((day) => {
                        const d = monthData[day];
                        return (
                          <View key={day} style={styles.row}>
                            <Text style={[styles.dateText, { flex: 0.8 }]}>
                              {day.split(".")[0]}
                            </Text>
                            <Text style={styles.cellText}>
                              {d.totalVolume.toLocaleString()}
                            </Text>
                            <Text
                              style={[styles.cellText, { color: "#16a34a" }]}
                            >
                              {d.income.toLocaleString()}
                            </Text>
                            <Text
                              style={[styles.cellText, { color: "#dc2626" }]}
                            >
                              {d.expense.toLocaleString()}
                            </Text>
                            <Text
                              style={[styles.cellText, { color: "#d97706" }]}
                            >
                              {d.returns.toLocaleString()}
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                </View>
              );
            })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, paddingHorizontal: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
    color: "#0f172a",
  },
  monthBlock: { marginBottom: 24 },
  monthTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  value: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#16a34a" },
  negativeBalance: { color: "#dc2626" },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
  cellText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "500",
    color: "#475569",
    textAlign: "center",
  },
});
