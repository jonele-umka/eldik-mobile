import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getPrices, getProduction } from "../../services/api";

export default function ProductionScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({});
  const [expanded, setExpanded] = useState({});
  const getDirectDriveImageUrl = (url) => {
    if (!url) return null;
    // Регулярное выражение для поиска ID файла в ссылках любого вида
    const match = url.match(/[-\w]{25,}/);
    if (match) {
      return `https://lh3.googleusercontent.com/d/${match[0]}=s400`;
    }
    return url;
  };
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, pricesRes] = await Promise.all([
        getProduction().catch(() => ({})),
        getPrices().catch(() => []),
      ]);

      const priceMap = {};
      (pricesRes || []).forEach((p) => {
        if (p.product) priceMap[p.product] = getDirectDriveImageUrl(p.image);
      });

      // Обогащаем данные картинками
      const finalData = {};
      Object.entries(prodRes || {}).forEach(([date, products]) => {
        finalData[date] = {};
        Object.entries(products).forEach(([name, info]) => {
          finalData[date][name] = { ...info, image: priceMap[name] || null };
        });
      });

      setData(finalData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const toggleExpand = (date, product) => {
    const key = `${date}-${product}`;
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadData} />
      }
    >
      <Text style={styles.title}>Производство</Text>

      {Object.entries(data).map(([date, products]) => (
        <View key={date} style={styles.dateSection}>
          <Text style={styles.dateHeader}>📅 {date}</Text>
          {Object.entries(products).map(([name, info]) => (
            <View key={name} style={styles.card}>
              <TouchableOpacity
                onPress={() => toggleExpand(date, name)}
                activeOpacity={0.7}
              >
                <View style={styles.headerRow}>
                  <Image
                    source={
                      info.image
                        ? { uri: info.image }
                        : {
                            uri: "https://www.scarlett.ru/upload/dev2fun.imagecompress/webp/resize_cache/iblock/605/77nrxyach9w191dubxh8ooe2st5zhzvn/960_5000_1/domashnee_pechene_top_20_receptov_1.webp",
                          }
                    }
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.toggleHint}>
                      {expanded[`${date}-${name}`]
                        ? "Свернуть ▲"
                        : "По рынкам ▼"}
                    </Text>
                  </View>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.totalQty}>{info.total}</Text>
                    <Text style={styles.unit}>шт</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {expanded[`${date}-${name}`] && (
                <View style={styles.marketList}>
                  {Object.entries(info.markets || {}).map(([market, qty]) => (
                    <View key={market} style={styles.marketRow}>
                      <View>
                        <Text style={styles.marketName}>📍 {market}</Text>

                        {!!info.marketComments?.[market] && (
                          <Text style={styles.commentText}>
                            💬 {info.marketComments[market]}
                          </Text>
                        )}
                      </View>

                      <Text style={styles.marketQty}>{qty} шт</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingHorizontal: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 60,
    marginBottom: 20,
  },
  dateSection: { marginBottom: 24 },
  dateHeader: {
    fontSize: 20,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#f1f5f9",
  },
  productInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  toggleHint: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "600",
  },
  qtyBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  totalQty: { fontSize: 18, fontWeight: "800", color: "#22c55e" },
  unit: { fontSize: 12, fontWeight: "600", color: "#22c55e", marginLeft: 2 },
  marketList: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  marketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  marketName: { color: "#475569", fontSize: 14 },
  marketQty: { fontWeight: "700", color: "#1a1a1a" },
  commentText: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 5,
  },
});
