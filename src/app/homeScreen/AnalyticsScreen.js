import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// 👇 ВАЖНО: импорт из api.js
import {
  fetchFinanceReport,
  getAnalytics,
  getOrders,
} from "../../services/api";

const AnalyticsScreen = forwardRef(({ noPadding = false }, ref) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState([]);
  const [finance, setFinance] = useState({});
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [markets, setMarkets] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [fin, orders, analyticsData] = await Promise.all([
        fetchFinanceReport(),
        getOrders(),
        getAnalytics(),
      ]);
      setAnalytics(analyticsData || []);
      const { products, clients, markets } = buildAnalytics(orders);
      setFinance(fin || {});
      setProducts(products);
      setClients(clients);
      setMarkets(markets);
    } finally {
      setLoading(false);
    }
  };
  useImperativeHandle(ref, () => ({
    load,
  }));

  useEffect(() => {
    load();
  }, []);
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const pureDate = dateStr.split(" ")[0];

    const [day, month, year] = pureDate.split(".");

    return new Date(Number(year), Number(month) - 1, Number(day));
  };
  // 🧠 АНАЛИТИКА НА ФРОНТЕ (БЫСТРО И БЕЗ НАГРУЗКИ НА СЕРВЕР)
  const buildAnalytics = (orders) => {
    const productsMap = {};
    const clientsMap = {};
    const marketsMap = {};

    const now = new Date();

    const currentMonthOrders = orders.filter((o) => {
      const date = parseDate(o.orderDate);

      if (!date) return false;

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    currentMonthOrders.forEach((o) => {
      const product = o.product;
      const client = o.client;
      const market = o.market;

      const qty = Number(o.quantity || 0);
      const total = Number(o.total || 0);

      // PRODUCTS
      if (product) {
        if (!productsMap[product]) {
          productsMap[product] = {
            product,
            qty: 0,
            revenue: 0,
          };
        }

        productsMap[product].qty += qty;
        productsMap[product].revenue += total;
      }

      // CLIENTS
      if (client) {
        if (!clientsMap[client]) {
          clientsMap[client] = {
            client,
            orders: 0,
            revenue: 0,
          };
        }

        clientsMap[client].orders += 1;
        clientsMap[client].revenue += total;
      }

      // MARKETS
      if (market) {
        if (!marketsMap[market]) {
          marketsMap[market] = {
            market,
            orders: 0,
            revenue: 0,
          };
        }

        marketsMap[market].orders += 1;
        marketsMap[market].revenue += total;
      }
    });

    return {
      products: Object.values(productsMap).sort(
        (a, b) => b.revenue - a.revenue,
      ),

      clients: Object.values(clientsMap).sort((a, b) => b.revenue - a.revenue),

      markets: Object.values(marketsMap).sort((a, b) => b.revenue - a.revenue),
    };
  };

  // 📅 months
  const months = Object.keys(finance || {});
  const currentMonth = selectedMonth || months[months.length - 1];

  const getMonthData = (month) => {
    if (!finance[month]) return { income: 0, expense: 0, returns: 0 };

    let income = 0;
    let expense = 0;
    let returns = 0;

    Object.values(finance[month]).forEach((d) => {
      income += d.income || 0;
      expense += d.expense || 0;
      returns += d.returns || 0;
    });

    return { income, expense, returns };
  };

  const data = getMonthData(currentMonth || "");

  const profit = data.income - data.expense - data.returns;
  const renderSection = (title, data, renderItem) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map((item, i) => (
        <View key={i}>{renderItem(item, i)}</View>
      ))}
    </View>
  );
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, noPadding && { padding: 0 }]}
      // contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.headerTitle}>
        Аналитика за{" "}
        {new Date().toLocaleDateString("ru-RU", {
          month: "long",
          year: "numeric",
        })}
      </Text>

      {/* 💰 FINANCE - Красивая карточка с итогами */}
      <View style={[styles.card, styles.financeCard]}>
        <Text style={styles.financeLabel}>Чистая прибыль</Text>
        <Text style={styles.profitValue}>{profit.toLocaleString()} сом</Text>
        <View style={styles.row}>
          <Text style={styles.subText}>
            Выручка: {data.income.toLocaleString()}
          </Text>
          <Text style={[styles.subText, { color: "#ff4757" }]}>
            Расходы: {data.expense.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* 📦 PRODUCTS / 👥 CLIENTS / 🏪 MARKETS */}
      {renderSection("📦 Топ товаров", products, (p, i) => (
        <View style={styles.listItem}>
          <Text style={styles.listText}>
            {i + 1}. {p.product}
          </Text>

          <Text style={styles.listSub}>
            {p.qty} шт • {p.revenue.toLocaleString()} сом
          </Text>
        </View>
      ))}

      {renderSection("👥 Топ клиентов", clients, (c, i) => (
        <View style={styles.listItem}>
          <Text style={styles.listText}>
            {i + 1}. {c.client}
          </Text>
          <Text style={styles.listSub}>
            {c.orders} зак. • {c.revenue.toLocaleString()} сом
          </Text>
        </View>
      ))}
      {renderSection("🏪 Топ рынков", markets, (m, i) => (
        <View style={styles.listItem}>
          <Text style={styles.listText}>
            {i + 1}. {m.market}
          </Text>
          <Text style={styles.listSub}>
            {m.orders} зак. • {m.revenue.toLocaleString()} сом
          </Text>
        </View>
      ))}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Аналитика по рынкам</Text>

        {analytics.map((item, index) => (
          <View key={index} style={styles.analyticsCard}>
            <Text style={styles.marketTitle}>{item.market}</Text>

            <View style={styles.analyticsRow}>
              <Text>Выручка</Text>
              <Text>{Number(item.revenue).toLocaleString()} сом</Text>
            </View>

            <View style={styles.analyticsRow}>
              <Text>Приход</Text>
              <Text>{Number(item.income).toLocaleString()} сом</Text>
            </View>

            <View style={styles.analyticsRow}>
              <Text>Расход</Text>
              <Text>{Number(item.expense).toLocaleString()} сом</Text>
            </View>

            <View style={styles.analyticsRow}>
              <Text>Возврат</Text>
              <Text>{Number(item.returns).toLocaleString()} сом</Text>
            </View>

            <View style={styles.analyticsRow}>
              <Text
                style={{
                  fontWeight: "700",
                  color: "#27ae60",
                }}
              >
                Прибыль
              </Text>

              <Text
                style={{
                  fontWeight: "700",
                  color: "#27ae60",
                }}
              >
                {Number(item.profit).toLocaleString()} сом
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  headerTitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  financeCard: { backgroundColor: "#2d3436" },
  financeLabel: { color: "#b2bec3", fontSize: 14 },
  profitValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  subText: { color: "#fff", fontSize: 13 },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#2d3436",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  listText: { fontSize: 15, fontWeight: "500", color: "#2d3436" },
  listSub: { fontSize: 13, color: "#636e72" },
  analyticsCard: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  marketTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    color: "#2d3436",
  },

  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
});
export default AnalyticsScreen;
