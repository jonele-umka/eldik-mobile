import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchFinanceReport, getOrders } from "../../services/api";

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [finance, setFinance] = useState({});

  const groupOrders = (rawData) => {
    const groups = {};

    rawData.forEach((item) => {
      if (!item.client || !item.product) return;

      const key = item.orderId;
      if (!key) return;

      if (!groups[key]) {
        groups[key] = {
          orderId: item.orderId,
          client: String(item.client).trim(),
          market: String(item.market).trim(),
          deliveryDate: String(item.deliveryDate).trim(),
          orderDate: String(item.orderDate).trim(),
          status: item.status || "Новый",
          items: [],
          totalSum: 0,
          paidAmount: Number(item.paidAmount || 0),
          returnedAmount: Number(item.returnedAmount || 0),
        };
      }

      groups[key].items.push({
        id: item.id || "",
        product: String(item.product).trim(),
        quantity: String(item.quantity),
        price: String(item.price),
        total: String(item.total),
        comment: item.comment || "",
        giftQty: Number(item.giftQty || 0),
        paidQty: Number(item.paidQuantity || item.quantity),
        finalQty: Number(item.finalQuantity || item.quantity),
      });

      const cleanTotal = String(item.total)
        .replace(/[\s\u00a0]/g, "")
        .replace(",", ".");
      groups[key].totalSum += parseFloat(cleanTotal) || 0;
    });

    return Object.values(groups).sort((a, b) => {
      try {
        const parseDateTime = (dateStr) => {
          if (!dateStr) return new Date(0);
          const [datePart, timePart] = dateStr.split(" ");
          const [day, month, year] = datePart.split(".").map(Number);
          if (timePart) {
            const [hours, minutes, seconds] = timePart.split(":").map(Number);
            return new Date(year, month - 1, day, hours, minutes, seconds || 0);
          }
          return new Date(year, month - 1, day);
        };
        return parseDateTime(b.orderDate) - parseDateTime(a.orderDate);
      } catch (e) {
        return 0;
      }
    });
  };

  const loadData = async (isRefreshed = false) => {
    if (!isRefreshed) setLoading(true);

    try {
      const [ordersData, financeData] = await Promise.all([
        getOrders(),
        fetchFinanceReport(),
      ]);

      setFinance(financeData || {});

      if (ordersData && Array.isArray(ordersData)) {
        setOrders(groupOrders(ordersData));
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Ошибка:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [])
  );

  const getFinanceStatus = (order) => {
    const netSum = order.totalSum - order.returnedAmount;
    const debt = netSum - order.paidAmount;

    if (order.returnedAmount >= order.totalSum)
      return { text: "Полный возврат", color: "#64748b", bg: "#f1f5f9" };
    if (debt <= 0) return { text: "Оплачено", color: "#16a34a", bg: "#dcfce7" };
    if (order.paidAmount > 0)
      return { text: "Част. оплачен", color: "#d97706", bg: "#fef3c7" };
    return { text: "Не оплачен", color: "#dc2626", bg: "#fee2e2" };
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  let lastOrderDay = "";
  let lastMarket = "";

  const totalOrdersSum = orders.reduce((sum, o) => sum + o.totalSum, 0);
  const totalPaidSum = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalReturnedSum = orders.reduce((sum, o) => sum + o.returnedAmount, 0);
  const totalDebtSum = orders.reduce(
    (sum, o) => sum + Math.max(0, o.totalSum - o.returnedAmount - o.paidAmount),
    0
  );
  const netVolume = totalOrdersSum - totalReturnedSum;

  // Расходы — из finance (отдельные траты, не связаны с заказами)
  let totalExpenseSum = 0;
  Object.values(finance || {}).forEach((monthData) => {
    Object.values(monthData).forEach((d) => {
      totalExpenseSum += Number(d.expense || 0);
    });
  });

  // Баланс = реально полученные деньги − расходы
  // Возвраты товара без оплаты НЕ влияют на баланс
  // Если клиент вернул товар который оплатил — это уже отражено в paidAmount
  const balance = totalPaidSum - totalExpenseSum;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.screenTitle}>Список заказов</Text>

      <View style={styles.summaryContainer}>
        <View style={styles.grid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
            ]}
          >
            <Text style={styles.summaryLabel}>Общая сумма заказов</Text>
            <Text style={[styles.summaryValue, { color: "#2563eb" }]}>
              {totalOrdersSum.toLocaleString()} сом
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#dcfce7", borderColor: "#86efac" },
            ]}
          >
            <Text style={styles.summaryLabel}>Оплачено</Text>
            <Text style={[styles.summaryValue, { color: "#16a34a" }]}>
              {totalPaidSum.toLocaleString()} сом
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
            ]}
          >
            <Text style={styles.summaryLabel}>Общий долг</Text>
            <Text style={[styles.summaryValue, { color: "#dc2626" }]}>
              {totalDebtSum.toLocaleString()} сом
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#fff7ed", borderColor: "#fdba74" },
            ]}
          >
            <Text style={styles.summaryLabel}>Возвраты</Text>
            <Text style={[styles.summaryValue, { color: "#ea580c" }]}>
              {totalReturnedSum.toLocaleString()} сом
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#f3e8ff", borderColor: "#c4b5fd" },
            ]}
          >
            <Text style={styles.summaryLabel}>Чистый объем</Text>
            <Text style={[styles.summaryValue, { color: "#7c3aed" }]}>
              {netVolume.toLocaleString()} сом
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#fff1f2", borderColor: "#fca5a5" },
            ]}
          >
            <Text style={styles.summaryLabel}>Расходы</Text>
            <Text style={[styles.summaryValue, { color: "#dc2626" }]}>
              {totalExpenseSum.toLocaleString()} сом
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: "#f0fdf4", borderColor: "#86efac" },
            ]}
          >
            <Text style={styles.summaryLabel}>Баланс</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: balance >= 0 ? "#16a34a" : "#dc2626" },
              ]}
            >
              {balance.toLocaleString()} сом
            </Text>
          </View>
        </View>
      </View>

      {orders.length === 0 ? (
        <Text style={styles.emptyText}>Заказы не найдены.</Text>
      ) : (
        orders.map((order) => {
          const currentOrderDay = order.orderDate
            ? order.orderDate.split(" ")[0]
            : "";
          const showDateHeader = currentOrderDay !== lastOrderDay;
          const showMarketHeader =
            showDateHeader || order.market !== lastMarket;

          lastOrderDay = currentOrderDay;
          lastMarket = order.market;

          const finStatus = getFinanceStatus(order);
          const finalSum = order.totalSum - order.returnedAmount;
          const remainingDebt = finalSum - order.paidAmount;

          return (
            <View key={order.orderId}>
              {showDateHeader && (
                <View style={styles.dateHeaderContainer}>
                  <Text style={styles.dateHeaderText}>
                    📝 Записан: {currentOrderDay}
                  </Text>
                </View>
              )}

              {showMarketHeader && (
                <Text style={styles.marketHeaderText}>
                  🏪 Рынок: {order.market}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.orderCard,
                  {
                    borderColor: finStatus.color,
                    shadowColor: finStatus.color,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "details/orderDetail",
                    params: { orderParam: JSON.stringify(order) },
                  })
                }
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.clientText}>{order.client}</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View
                      style={{
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                        backgroundColor:
                          order.status === "Доставлен" ? "#dcfce7" : "#fef3c7",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            order.status === "Доставлен"
                              ? "#16a34a"
                              : "#d97706",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {order.status}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: finStatus.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: finStatus.color }]}
                      >
                        {finStatus.text}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.deliveryDateSubText}>
                  🚚 Доставка: {order.deliveryDate} • Позиций:{" "}
                  {order.items.reduce((s, i) => s + Number(i.quantity || 0), 0)}
                </Text>

                <View style={styles.financeGrid}>
                  <View style={styles.finColumn}>
                    <Text style={styles.finLabel}>Сумма чека</Text>
                    <Text style={styles.finValue}>
                      {finalSum.toLocaleString()} сом
                    </Text>
                  </View>
                  <View style={styles.finColumn}>
                    <Text style={styles.finLabel}>Оплачено</Text>
                    <Text style={[styles.finValue, { color: "#16a34a" }]}>
                      {order.paidAmount.toLocaleString()} сом
                    </Text>
                  </View>
                  <View style={styles.finColumn}>
                    <Text style={styles.finLabel}>Остаток</Text>
                    <Text
                      style={[
                        styles.finValue,
                        { color: remainingDebt > 0 ? "#dc2626" : "#16a34a" },
                      ]}
                    >
                      {Math.max(0, remainingDebt).toLocaleString()} сом
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })
      )}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingHorizontal: 16 },
  scrollContent: { flexGrow: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 60,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 14,
  },
  dateHeaderContainer: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 6,
  },
  dateHeaderText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  marketHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    marginLeft: 4,
    marginBottom: 6,
    marginTop: 8,
    textTransform: "uppercase",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeaderRow: {
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 8,
  },
  deliveryDateSubText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    marginBottom: 12,
  },
  financeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
    paddingTop: 10,
  },
  finColumn: { flex: 1 },
  finLabel: {
    fontSize: 10,
    color: "#999",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 2,
  },
  finValue: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  summaryContainer: { marginBottom: 20 },
  grid: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  summaryCard: {
    flex: 1,
    minHeight: 50,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  summaryValue: { fontSize: 22, fontWeight: "800" },
});
