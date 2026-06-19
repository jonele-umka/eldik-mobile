import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import HomeButton from "../../components/HomeButton/HomeButton";
import { usePromo } from "../../context/PromoContext";
import {
  getClients,
  getPrices,
  saveClient,
  saveOrder,
} from "../../services/api";

export default function CreateOrder() {
  const [market, setMarket] = useState("");
  const [client, setClient] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientsData, setClientsData] = useState({});
  const [prices, setPrices] = useState({});
  const [products, setProducts] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectType, setSelectType] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [newClient, setNewClient] = useState({
    market: "",
    name: "",
    address: "",
    phone: "",
  });
  const [isSavingClient, setIsSavingClient] = useState(false);
  const { promoEnabled } = usePromo();
  function openMarketModal() {
    setSelectType("market");
    setSearch("");
    setSelectModalVisible(true);
  }

  function openClientModal() {
    setSelectType("client");
    setSearch("");
    setSelectModalVisible(true);
  }

  useEffect(() => {
    async function fetchData() {
      setIsDataLoading(true);
      try {
        const [clients, pricesData] = await Promise.all([
          getClients(),
          getPrices(),
        ]);

        const formattedClients = clients.reduce((acc, client) => {
          const m = client.market || "Без рынка";
          if (!acc[m]) acc[m] = [];
          acc[m].push(client.name);
          return acc;
        }, {});

        setClientsData(formattedClients);

        const firstMarket = Object.keys(formattedClients)[0];
        if (firstMarket) {
          setMarket(firstMarket);
          setClient(formattedClients[firstMarket][0]);
        }

        const pricesMap = {};
        const productsList = [];

        pricesData.forEach((item) => {
          pricesMap[item.product] = Number(item.price || 0);
          productsList.push(item.product);
        });

        setPrices(pricesMap);
        setProducts(productsList);

        const initialItems = {};
        productsList.forEach((product) => {
          initialItems[product] = { qty: 0, comment: "" };
        });
        setItems(initialItems);
      } catch (e) {
        console.error(e);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchData();
  }, []);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [deliveryDate, setDeliveryDate] = useState(tomorrow);
  const [items, setItems] = useState({});

  function handleMarketChange(selectedMarket) {
    setMarket(selectedMarket);
    const marketClients = clientsData[selectedMarket] || [];
    setClient(marketClients[0] || "");
  }

  function plus(product) {
    if (loading) return;
    setItems((prev) => ({
      ...prev,
      [product]: { ...prev[product], qty: prev[product].qty + 1 },
    }));
  }

  function minus(product) {
    if (loading) return;
    setItems((prev) => ({
      ...prev,
      [product]: {
        ...prev[product],
        qty: Math.max(0, prev[product].qty - 1),
      },
    }));
  }

  function calculatePromo(qty) {
    const giftQty = promoEnabled ? Math.floor(qty / 10) : 0;
    return {
      giftQty,
      finalQty: qty + giftQty,
      paidQty: qty,
    };
  }

  function changeComment(product, text) {
    if (loading) return;
    setItems((prev) => ({
      ...prev,
      [product]: { ...prev[product], comment: text },
    }));
  }

  const totalBoxes = useMemo(() => {
    return Object.values(items).reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  function getPrice(product) {
    const basePrice = prices[product] || 0;
    return market === "Аламедин" ? basePrice + 20 : basePrice;
  }

  const totalAmount = useMemo(() => {
    return Object.entries(items).reduce((sum, [product, item]) => {
      return sum + item.qty * getPrice(product);
    }, 0);
  }, [items, market]);

  // ✅ ИСПРАВЛЕННЫЙ handleSave
  async function handleSave() {
    const orderItems = Object.entries(items)
      .filter(([_, item]) => item.qty > 0)
      .map(([product, item]) => {
        const { paidQty, giftQty, finalQty } = calculatePromo(item.qty);

        return {
          product,
          quantity: paidQty, // ✅ чистое количество без подарков
          paidQuantity: paidQty, // ✅
          giftQty: giftQty, // ✅ правильное поле (было giftQuantity)
          finalQuantity: finalQty, // ✅ добавлено
          price: getPrice(product),
          comment: item.comment,
        };
      });

    if (orderItems.length === 0) {
      Alert.alert("Ошибка", "Добавьте хотя бы один товар");
      return;
    }

    // ✅ надёжный формат даты dd.MM.yyyy
    const d = deliveryDate;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    try {
      setLoading(true);

      const res = await saveOrder({
        client,
        market,
        deliveryDate: formattedDate,
        items: orderItems,
      });

      const resetItems = {};
      products.forEach((product) => {
        resetItems[product] = { qty: 0, comment: "" };
      });
      setItems(resetItems);

      Alert.alert("Успех", "Заказ сохранен", [
        { text: "ОК", onPress: () => router.replace("/home") },
      ]);
    } catch (e) {
      console.log(e);
      Alert.alert("Ошибка", String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveClient() {
    if (!newClient.market || !newClient.name) {
      Alert.alert("Ошибка", "Заполните рынок и имя");
      return;
    }

    setIsSavingClient(true);
    try {
      const response = await saveClient(newClient);

      if (response && response.success === false) {
        throw new Error(response.error || "Ошибка сохранения");
      }

      const rawData = await getClients();
      const formatted = rawData.reduce((acc, client) => {
        const m = client.market || "Без рынка";
        if (!acc[m]) acc[m] = [];
        acc[m].push(client.name);
        return acc;
      }, {});

      setClientsData(formatted);
      setModalVisible(false);
      setNewClient({ market: "", name: "", address: "", phone: "" });
      Alert.alert("Успех", "Клиент добавлен");
    } catch (e) {
      console.error(e);
      Alert.alert("Ошибка", "Не удалось сохранить: " + e.message);
    } finally {
      setIsSavingClient(false);
    }
  }

  const marketList = Object.keys(clientsData).filter((key) => isNaN(key));

  const clientList = (clientsData[market] || []).filter((item) =>
    item.toLowerCase().includes(search.toLowerCase()),
  );

  const data =
    selectType === "market"
      ? marketList.filter((item) =>
          item.toLowerCase().includes(search.toLowerCase()),
        )
      : clientList;

  if (isDataLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Загрузка данных...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <HomeButton />
        <Text style={styles.title}>Новый заказ</Text>

        <Text style={styles.label}>Дата доставки</Text>
        <TouchableOpacity
          disabled={loading}
          style={[styles.dateButton, loading && styles.disabledElement]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            📅 {deliveryDate.toLocaleDateString("ru-RU")}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={deliveryDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDeliveryDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity
          style={styles.addClient}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ fontSize: 20, color: "#fff", fontWeight: "bold" }}>
            Добавить клиент
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Рынок</Text>
        <TouchableOpacity style={styles.selectButton} onPress={openMarketModal}>
          <Text style={styles.selectText}>{market || "Выберите рынок"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Клиент</Text>
        <TouchableOpacity style={styles.selectButton} onPress={openClientModal}>
          <Text style={styles.selectText}>{client || "Выберите клиента"}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Выбор товаров</Text>

        {products.map((product) => {
          const item = items[product] || { qty: 0, comment: "" };
          const hasQty = item.qty > 0;
          const promo = calculatePromo(item.qty);

          return (
            <View
              key={product}
              style={[styles.productCard, hasQty && styles.activeProductCard]}
            >
              <View style={styles.topRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product}</Text>
                  <Text style={styles.productPrice}>
                    {getPrice(product)} сом / шт
                  </Text>
                  {promo.giftQty > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text
                        style={{
                          color: "#22c55e",
                          fontWeight: "700",
                          marginBottom: 5,
                        }}
                      >
                        🎁 Подарок: {promo.giftQty} шт
                      </Text>
                      <Text style={{ color: "#666" }}>
                        Итого выдача: {promo.finalQty} шт
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    disabled={loading}
                    style={[
                      styles.counterBtn,
                      styles.minusBtn,
                      !hasQty && styles.inactiveBtn,
                      loading && styles.disabledElement,
                    ]}
                    onPress={() => minus(product)}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.qtyInput, hasQty && styles.activeQtyText]}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={String(item.qty || "")}
                    onChangeText={(text) => {
                      const num = parseInt(text.replace(/[^0-9]/g, "")) || 0;
                      setItems((prev) => ({
                        ...prev,
                        [product]: { ...prev[product], qty: num },
                      }));
                    }}
                    editable={!loading}
                  />

                  <TouchableOpacity
                    disabled={loading}
                    style={[
                      styles.counterBtn,
                      styles.plusBtn,
                      loading && styles.disabledElement,
                    ]}
                    onPress={() => plus(product)}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {hasQty && (
                <TextInput
                  placeholder="Комментарий к товару (размер, замена...)"
                  placeholderTextColor="#666"
                  value={item.comment}
                  onChangeText={(text) => changeComment(product, text)}
                  style={[styles.commentInput, loading && styles.disabledInput]}
                  editable={!loading}
                />
              )}
            </View>
          );
        })}

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Всего коробок:</Text>
            <Text style={styles.summaryValue}>{totalBoxes} шт</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Общая сумма:</Text>
            <Text style={styles.totalValue}>
              {totalAmount.toLocaleString()} сом
            </Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={loading}
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>Сохранить заказ</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Модалка выбора рынка / клиента */}
      <Modal visible={selectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.selectModal}>
            <Text style={styles.sectionTitle}>
              {selectType === "market" ? "Выберите рынок" : "Выберите клиента"}
            </Text>
            <TextInput
              placeholder="Поиск..."
              placeholderTextColor="#666"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <ScrollView>
              {data.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.optionItem}
                  onPress={() => {
                    if (selectType === "market") {
                      handleMarketChange(item);
                    } else {
                      setClient(item);
                    }
                    setSelectModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSelectModalVisible(false)}
            >
              <Text>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модалка добавления клиента */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Новый клиент</Text>

            <TextInput
              placeholder="Рынок"
              placeholderTextColor="#666"
              value={newClient.market}
              editable={!isSavingClient}
              onChangeText={(text) =>
                setNewClient({ ...newClient, market: text })
              }
              style={[styles.input, isSavingClient && styles.disabledInput]}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {Object.keys(clientsData)
                .filter((key) => isNaN(key))
                .map((m) => (
                  <TouchableOpacity
                    key={m}
                    disabled={isSavingClient}
                    style={[
                      styles.marketTag,
                      isSavingClient && styles.disabledElement,
                    ]}
                    onPress={() => setNewClient({ ...newClient, market: m })}
                  >
                    <Text style={{ fontSize: 12 }}>{m}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TextInput
              placeholder="Имя клиента"
              placeholderTextColor="#666"
              value={newClient.name}
              editable={!isSavingClient}
              onChangeText={(text) =>
                setNewClient({ ...newClient, name: text })
              }
              style={[styles.input, isSavingClient && styles.disabledInput]}
            />
            <TextInput
              placeholder="Адрес"
              placeholderTextColor="#666"
              value={newClient.address}
              editable={!isSavingClient}
              onChangeText={(text) =>
                setNewClient({ ...newClient, address: text })
              }
              style={[styles.input, isSavingClient && styles.disabledInput]}
            />
            <TextInput
              placeholder="Телефон"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newClient.phone}
              editable={!isSavingClient}
              onChangeText={(text) =>
                setNewClient({
                  ...newClient,
                  phone: text.replace(/[^0-9]/g, ""),
                })
              }
              style={[styles.input, isSavingClient && styles.disabledInput]}
            />

            <TouchableOpacity
              style={[styles.saveBtn, isSavingClient && styles.saveBtnDisabled]}
              onPress={handleSaveClient}
              disabled={isSavingClient}
            >
              {isSavingClient ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Сохранить</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isSavingClient}
              onPress={() => setModalVisible(false)}
              style={[
                { marginTop: 10, alignItems: "center" },
                isSavingClient && styles.disabledElement,
              ]}
            >
              <Text style={{ color: "#666" }}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  dateText: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 15,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  activeProductCard: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productInfo: { flex: 1, paddingRight: 10 },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    flexShrink: 1,
  },
  productPrice: { fontSize: 13, fontWeight: "600", color: "#888" },
  counterContainer: { flexDirection: "row", alignItems: "center" },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  minusBtn: { backgroundColor: "#fee2e2" },
  plusBtn: { backgroundColor: "#dcfce7" },
  counterBtnText: { fontSize: 20, fontWeight: "700" },
  inactiveBtn: { backgroundColor: "#f1f3f5", opacity: 0.5 },
  qtyInput: {
    width: 50,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    paddingVertical: 5,
    marginHorizontal: 4,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  activeQtyText: { fontWeight: "800", color: "#1a1a1a", fontSize: 18 },
  commentInput: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: "#1a1a1a",
  },
  disabledInput: {
    backgroundColor: "#f1f3f5",
    borderColor: "#e9ecef",
    color: "#999",
  },
  disabledElement: { opacity: 0.5 },
  summaryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: { color: "#abb2bf", fontSize: 14, fontWeight: "600" },
  summaryValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  totalRow: {
    borderTopWidth: 1,
    borderColor: "#333",
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "700" },
  totalValue: { color: "#22c55e", fontSize: 22, fontWeight: "800" },
  saveBtn: {
    backgroundColor: "#1a1a1a",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  saveBtnDisabled: { backgroundColor: "#666", opacity: 0.7 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
  },
  marketTag: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  addClient: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 20,
  },
  selectButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  selectText: { color: "#1a1a1a", fontSize: 16 },
  selectModal: {
    backgroundColor: "#fff",
    marginTop: 100,
    marginHorizontal: 20,
    borderRadius: 20,
    maxHeight: "70%",
    padding: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    color: "#1a1a1a",
  },
  optionItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: { fontSize: 16, color: "#1a1a1a" },
  cancelBtn: { marginTop: 15, alignItems: "center" },
});
