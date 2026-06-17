import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getClients,
  getDebtors,
  getOrders,
  getReturns,
  saveDebtReturn,
  savePayment,
} from "../../services/api";

export default function DebtorsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [groupedDebtors, setGroupedDebtors] = useState({});

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);

  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const [clientItems, setClientItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedReturnProduct, setSelectedReturnProduct] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState("1");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function reloadAfterAction() {
    setReloading(true);
    await loadData();
    setReloading(false);
  }

  async function loadData() {
    try {
      const [debtorsData, clientsData] = await Promise.all([
        getDebtors(),
        getClients(),
      ]);

      const clientToMarket = {};
      (Array.isArray(clientsData) ? clientsData : []).forEach((c) => {
        if (c.name && c.market) {
          clientToMarket[c.name.trim().toLowerCase()] = c.market;
        }
      });

      const marketSet = new Set(Object.values(clientToMarket));
      const grouped = {};
      marketSet.forEach((m) => {
        grouped[m] = [];
      });
      grouped["Другие рынки"] = [];

      const onlyDebtors = (
        Array.isArray(debtorsData) ? debtorsData : Object.values(debtorsData)
      )
        .filter((item) => Math.round(item.debt) > 0)
        .sort((a, b) => Number(b.debt) - Number(a.debt));

      onlyDebtors.forEach((item) => {
        const market =
          clientToMarket[item.client.trim().toLowerCase()] || "Другие рынки";
        if (!grouped[market]) grouped[market] = [];
        grouped[market].push({ ...item, market });
      });

      setGroupedDebtors(grouped);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handlePayment = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Ошибка", "Введите сумму");
      return;
    }

    try {
      setPaymentLoading(true);

      const rawDate = selectedDebtor.lastOrderDate || "";
      const orderDate = rawDate.split(" ")[0];

      const res = await savePayment({
        client: selectedDebtor.client,
        amount,
        orderDate,
        market: selectedDebtor.market,
      });

      if (res.success) {
        Alert.alert("Успешно", "Оплата проведена");
        setPaymentModalVisible(false);
        setPaymentAmount("");
        await reloadAfterAction();
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось сохранить оплату");
    } finally {
      setPaymentLoading(false);
    }
  };

  const openReturnModal = async (item) => {
    setSelectedDebtor(item);
    setSelectedReturnProduct(null);
    setReturnQuantity("1");
    setReturnModalVisible(true);
    setItemsLoading(true);
    try {
      // Грузим заказы и возвраты параллельно
      const [allOrders, allReturns] = await Promise.all([
        getOrders(),
        getReturns(),
      ]);

      const clientName = item.client.trim().toLowerCase();

      // Считаем сколько каждого товара уже вернули этот клиент
      const returnedMap = {}; // { product: totalReturnedQty }
      (Array.isArray(allReturns) ? allReturns : [])
        .filter((r) => r.client?.trim().toLowerCase() === clientName)
        .forEach((r) => {
          const p = r.product?.trim();
          if (!p || p === "Возврат долга") return;
          returnedMap[p] = (returnedMap[p] || 0) + Number(r.quantity || 0);
        });

      // Суммируем заказанное количество по каждому товару
      const orderedMap = {}; // { product: { totalQty, price } }
      (Array.isArray(allOrders) ? allOrders : [])
        .filter(
          (o) => o.client?.trim().toLowerCase() === clientName && o.product
        )
        .forEach((o) => {
          const p = o.product.trim();
          if (!orderedMap[p]) {
            orderedMap[p] = { totalQty: 0, price: o.price };
          }
          orderedMap[p].totalQty += Number(o.quantity || 0);
        });

      // Строим итоговый список товаров с остатком для возврата
      const items = Object.entries(orderedMap)
        .map(([product, data]) => {
          const alreadyReturned = returnedMap[product] || 0;
          const remaining = data.totalQty - alreadyReturned;
          return {
            product,
            price: data.price,
            totalQty: data.totalQty,
            alreadyReturned,
            remaining, // сколько ещё можно вернуть
          };
        })
        .filter((p) => p.remaining > 0); // скрываем полностью возвращённые

      setClientItems(items);
    } catch (e) {
      console.log(e);
      setClientItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedReturnProduct) {
      Alert.alert("Ошибка", "Выберите товар");
      return;
    }
    const qty = parseInt(returnQuantity);
    if (!qty || qty <= 0) {
      Alert.alert("Ошибка", "Введите количество");
      return;
    }
    if (qty > selectedReturnProduct.remaining) {
      Alert.alert(
        "Ошибка",
        `Можно вернуть не более ${selectedReturnProduct.remaining} шт`
      );
      return;
    }
    const amount = qty * Number(selectedReturnProduct.price);

    try {
      setReturnLoading(true);

      const res = await saveDebtReturn({
        client: selectedDebtor.client,
        market: selectedDebtor.market,
        product: selectedReturnProduct.product,
        quantity: qty,
        price: Number(selectedReturnProduct.price),
        amount,
      });

      if (res.success) {
        Alert.alert("Успешно", "Возврат оформлен");
        setReturnModalVisible(false);
        setSelectedReturnProduct(null);
        setReturnQuantity("1");
        await reloadAfterAction();
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось оформить возврат");
    } finally {
      setReturnLoading(false);
    }
  };

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

  const marketsToRender = Object.keys(groupedDebtors).filter(
    (marketName) => groupedDebtors[marketName].length > 0
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Должники</Text>

        {marketsToRender.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              🎉 Отлично! Должников пока нет.
            </Text>
          </View>
        ) : (
          marketsToRender.map((marketName) => (
            <View key={marketName} style={styles.marketSection}>
              <Text style={styles.marketHeaderTitle}>📍 {marketName}</Text>

              {groupedDebtors[marketName].map((item) => (
                <View
                  key={item.client}
                  style={[styles.card, styles.activeDebtCard]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.name}>👤 {item.client}</Text>
                    <Text style={styles.miniDebtBadge}>
                      -{Number(item.debt).toLocaleString()} c.
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📦 Заказано:</Text>
                    <Text style={[styles.infoValue, { color: "#1a1a1a" }]}>
                      {Number(item.ordered).toLocaleString()} сом
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>🔄 Возвраты:</Text>
                    <Text style={[styles.infoValue, { color: "#dc2626" }]}>
                      {Number(item.returns).toLocaleString()} сом
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>💵 Оплачено:</Text>
                    <Text style={[styles.infoValue, { color: "#16a34a" }]}>
                      {Number(item.paid).toLocaleString()} сом
                    </Text>
                  </View>

                  <View style={[styles.infoRow, styles.debtRow]}>
                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 12,
                        marginBottom: 20,
                      }}
                    >
                      <TouchableOpacity
                        disabled={paymentLoading}
                        style={{
                          flex: 1,
                          backgroundColor: "#16a34a",
                          padding: 10,
                          borderRadius: 8,
                          marginRight: 6,
                          alignItems: "center",
                        }}
                        onPress={() => {
                          setSelectedDebtor(item);
                          setPaymentAmount("");
                          setPaymentModalVisible(true);
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>
                          💵 Оплата
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={returnLoading}
                        style={{
                          flex: 1,
                          backgroundColor: "#dc2626",
                          padding: 10,
                          borderRadius: 8,
                          marginLeft: 6,
                          alignItems: "center",
                        }}
                        onPress={() => openReturnModal(item)}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>
                          🔄 Возврат
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View>
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

        {/* Модалка оплаты */}
        <Modal
          visible={paymentModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Оплата: {selectedDebtor?.client}
              </Text>
              <TextInput
                style={styles.moneyInput}
                keyboardType="numeric"
                placeholder="Сумма оплаты"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
              {paymentLoading ? (
                <ActivityIndicator color="#16a34a" />
              ) : (
                <TouchableOpacity
                  onPress={handlePayment}
                  disabled={paymentLoading}
                  style={{
                    backgroundColor: "#16a34a",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Сохранить оплату
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={paymentLoading}
                onPress={() => {
                  setPaymentModalVisible(false);
                  setPaymentAmount("");
                }}
              >
                <Text>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Модалка возврата */}
        <Modal
          visible={returnModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!returnLoading) setReturnModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Возврат: {selectedDebtor?.client}
              </Text>

              {/* Список товаров */}
              {itemsLoading ? (
                <ActivityIndicator
                  color="#dc2626"
                  style={{ marginVertical: 20 }}
                />
              ) : clientItems.length === 0 ? (
                <Text style={styles.noItemsText}>
                  Нет товаров доступных для возврата
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
                  {clientItems.map((product) => {
                    const isSelected =
                      selectedReturnProduct?.product === product.product;
                    return (
                      <TouchableOpacity
                        key={product.product}
                        disabled={returnLoading}
                        style={[
                          styles.returnProductItem,
                          isSelected && styles.returnProductItemSelected,
                          returnLoading && { opacity: 0.6 },
                        ]}
                        onPress={() => {
                          setSelectedReturnProduct(product);
                          setReturnQuantity("1");
                        }}
                      >
                        <View style={styles.returnProductRow}>
                          <Text style={styles.returnProductName}>
                            {product.product}
                          </Text>
                          {/* Бейдж — сколько можно вернуть */}
                          <View style={styles.remainingBadge}>
                            <Text style={styles.remainingBadgeText}>
                              ещё {product.remaining} шт
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.returnProductPrice}>
                          {Number(product.price).toLocaleString()} сом / шт
                          {product.alreadyReturned > 0 && (
                            <Text style={{ color: "#dc2626" }}>
                              {" "}
                              · уже возвращено: {product.alreadyReturned} шт
                            </Text>
                          )}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Количество и сумма */}
              {selectedReturnProduct && !itemsLoading && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.returnQtyLabel}>
                    Количество для возврата (макс.{" "}
                    {selectedReturnProduct.remaining} шт):
                  </Text>
                  <TextInput
                    editable={!returnLoading}
                    style={[
                      styles.moneyInput,
                      returnLoading && { opacity: 0.6 },
                    ]}
                    keyboardType="numeric"
                    placeholder="Количество"
                    value={returnQuantity}
                    onChangeText={(val) => {
                      // Не даём ввести больше чем remaining
                      const num = parseInt(val) || 0;
                      if (num > selectedReturnProduct.remaining) {
                        setReturnQuantity(
                          String(selectedReturnProduct.remaining)
                        );
                      } else {
                        setReturnQuantity(val);
                      }
                    }}
                  />
                  <Text style={styles.returnSumText}>
                    Сумма возврата:{" "}
                    {(
                      (parseInt(returnQuantity) || 0) *
                      Number(selectedReturnProduct.price)
                    ).toLocaleString()}{" "}
                    сом
                  </Text>
                </View>
              )}

              {returnLoading ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <TouchableOpacity
                  onPress={handleReturn}
                  disabled={
                    itemsLoading || !selectedReturnProduct || returnLoading
                  }
                  style={{
                    backgroundColor:
                      itemsLoading || !selectedReturnProduct
                        ? "#fca5a5"
                        : "#dc2626",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Оформить возврат
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={returnLoading}
                onPress={() => {
                  setReturnModalVisible(false);
                  setSelectedReturnProduct(null);
                  setReturnQuantity("1");
                }}
              >
                <Text style={returnLoading && { color: "#ccc" }}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Оверлей перезагрузки */}
      {reloading && (
        <View style={styles.reloadOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.reloadText}>Обновление данных...</Text>
        </View>
      )}
    </>
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
  marketSection: { marginTop: 15, marginBottom: 10 },
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
  activeDebtCard: { borderColor: "#fee2e2" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
    paddingBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
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
  infoLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#1a1a1a", fontWeight: "600" },
  debtRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    marginTop: 10,
    paddingTop: 10,
    marginBottom: 0,
  },
  debtLabel: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  debtValue: { fontSize: 16, fontWeight: "800" },
  textRed: { color: "#ef4444" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 20,
  },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#22c55e" },
  spacer: { height: 40 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  moneyInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: "#000",
    fontSize: 16,
    textAlign: "center",
  },
  cancelBtn: { marginTop: 10, alignItems: "center" },
  noItemsText: {
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  returnProductItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  returnProductItemSelected: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
  },
  returnProductRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  returnProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  remainingBadge: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  remainingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16a34a",
  },
  returnProductPrice: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  returnQtyLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginBottom: 6,
  },
  returnSumText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#dc2626",
    textAlign: "center",
  },
  reloadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
    elevation: 99999,
  },
  reloadText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
});
