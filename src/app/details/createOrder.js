import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
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
import PRICES from "../../constants/prices";
import PRODUCTS from "../../constants/products";
import { getClients, saveClient, saveOrder } from "../../services/api";

export default function CreateOrder() {
  const [market, setMarket] = useState("");
  const [client, setClient] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientsData, setClientsData] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const [newClient, setNewClient] = useState({
    market: "",
    name: "",
    address: "",
    phone: "",
  });
  const [isSavingClient, setIsSavingClient] = useState(false);
  // Внутри CreateOrder.js
  useEffect(() => {
    async function fetchData() {
      setIsDataLoading(true);
      try {
        const data = await getClients();
        const formatted = data.reduce((acc, client) => {
          const m = client.market || "Без рынка";
          if (!acc[m]) acc[m] = [];
          acc[m].push(client.name);
          return acc;
        }, {});

        setClientsData(formatted);

        // Инициализируем рынок и клиента, если они пустые
        const firstMarket = Object.keys(formatted)[0];
        if (firstMarket) {
          setMarket(firstMarket);
          setClient(formatted[firstMarket][0]);
        }
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

  // Состояние товаров со структурой { qty, comment }
  const [items, setItems] = useState(
    PRODUCTS.reduce((acc, product) => {
      acc[product] = {
        qty: 0,
        comment: "",
      };
      return acc;
    }, {})
  );

  function handleMarketChange(selectedMarket) {
    setMarket(selectedMarket);

    const marketClients = clientsData[selectedMarket] || [];
    setClient(marketClients[0] || "");
  }

  function plus(product) {
    if (loading) return;
    setItems((prev) => ({
      ...prev,
      [product]: {
        ...prev[product],
        qty: prev[product].qty + 1,
      },
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

  function changeComment(product, text) {
    if (loading) return;
    setItems((prev) => ({
      ...prev,
      [product]: {
        ...prev[product],
        comment: text,
      },
    }));
  }

  const totalBoxes = useMemo(() => {
    return Object.values(items).reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return Object.entries(items).reduce((sum, [product, item]) => {
      return sum + item.qty * (PRICES[product] || 0);
    }, 0);
  }, [items]);

  async function handleSave() {
    const orderItems = Object.entries(items)
      .filter(([_, item]) => item.qty > 0)
      .map(([product, item]) => ({
        product,
        quantity: item.qty,
        comment: item.comment,
      }));

    if (orderItems.length === 0) {
      Alert.alert("Ошибка", "Добавьте хотя бы один товар");
      return;
    }

    try {
      setLoading(true);

      await saveOrder({
        client,
        market,
        deliveryDate: deliveryDate.toLocaleDateString("ru-RU"),
        items: orderItems,
      });

      setItems(
        PRODUCTS.reduce((acc, product) => {
          acc[product] = {
            qty: 0,
            comment: "",
          };
          return acc;
        }, {})
      );

      Alert.alert("Успех", "Заказ сохранен", [
        {
          text: "ОК",
          onPress: () => {
            router.replace("/home");
          },
        },
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
      // Вызываем импортированную функцию из api.js
      const response = await saveClient(newClient);

      // Проверяем, что вернул сервер (зависит от того, как написан GAS)
      if (response && response.success === false) {
        throw new Error(response.error || "Ошибка сохранения");
      }

      // Обновляем список клиентов
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
        <Text style={styles.title}>Новый заказ</Text>

        {/* Выбор даты */}
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
              if (selectedDate) {
                setDeliveryDate(selectedDate);
              }
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
        {/* Выбор рынка */}
        <Text style={styles.label}>Рынок</Text>
        <View
          style={[styles.pickerContainer, loading && styles.disabledElement]}
        >
          <Picker
            enabled={!loading}
            selectedValue={market}
            onValueChange={handleMarketChange}
            dropdownIconColor="#1a1a1a"
            style={{ color: "#1a1a1a" }}
          >
            {Object.keys(clientsData)
              .filter((key) => isNaN(key))
              .map((m) => (
                <Picker.Item key={m} label={m} value={m} color="#1a1a1a" />
              ))}
          </Picker>
        </View>

        {/* Выбор клиента */}
        <Text style={styles.label}>Клиент</Text>
        <View
          style={[styles.pickerContainer, loading && styles.disabledElement]}
        >
          <Picker
            enabled={!loading}
            selectedValue={client}
            onValueChange={setClient}
            dropdownIconColor="#1a1a1a"
            style={{ color: "#1a1a1a" }}
          >
            {/* Берем данные из актуального стейта clientsData */}
            {(clientsData[market] || []).map((name) => (
              <Picker.Item
                key={name}
                label={name}
                value={name}
                color="#1a1a1a"
              />
            ))}
          </Picker>
        </View>

        {/* Список товаров */}
        <Text style={styles.sectionTitle}>Выбор товаров</Text>

        {PRODUCTS.map((product) => {
          const hasQty = items[product].qty > 0;
          return (
            <View
              key={product}
              style={[styles.productCard, hasQty && styles.activeProductCard]}
            >
              <View style={styles.topRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product}</Text>
                  <Text style={styles.productPrice}>
                    {PRICES[product] || 0} сом / шт
                  </Text>
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

                  {/* ЗАМЕНА TEXT НА TEXTINPUT */}
                  <TextInput
                    style={[styles.qtyInput, hasQty && styles.activeQtyText]}
                    keyboardType="numeric"
                    value={String(items[product].qty || "")}
                    onChangeText={(text) => {
                      // Убираем всё, кроме цифр
                      const num = parseInt(text.replace(/[^0-9]/g, "")) || 0;
                      setItems((prev) => ({
                        ...prev,
                        [product]: {
                          ...prev[product],
                          qty: num,
                        },
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

              {/* Инпут комментария внутри карточки товара */}
              {hasQty && (
                <TextInput
                  placeholder="Комментарий к товару (размер, замена...)"
                  placeholderTextColor="#999"
                  value={items[product].comment}
                  onChangeText={(text) => changeComment(product, text)}
                  style={[styles.commentInput, loading && styles.disabledInput]}
                  editable={!loading}
                />
              )}
            </View>
          );
        })}

        {/* Блок итогов */}
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

        {/* Кнопка сохранения */}
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

      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Новый клиент</Text>

            {/* Поле для ввода рынка */}
            <TextInput
              placeholder="Рынок"
              value={newClient.market}
              editable={!isSavingClient} // Блокировка ввода
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
                    disabled={isSavingClient} // Блокировка выбора тага
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
              value={newClient.name}
              editable={!isSavingClient}
              onChangeText={(text) =>
                setNewClient({ ...newClient, name: text })
              }
              style={[styles.input, isSavingClient && styles.disabledInput]}
            />
            <TextInput
              placeholder="Адрес"
              value={newClient.address}
              editable={!isSavingClient}
              onChangeText={(text) =>
                setNewClient({ ...newClient, address: text })
              }
              style={[styles.input, isSavingClient && styles.disabledInput]}
            />
            <TextInput
              placeholder="Телефон"
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

            {/* Кнопка Сохранить */}
            <TouchableOpacity
              style={[styles.saveBtn, isSavingClient && styles.saveBtnDisabled]}
              onPress={handleSaveClient}
              disabled={isSavingClient} // Блокировка кнопки
            >
              {isSavingClient ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Сохранить</Text>
              )}
            </TouchableOpacity>

            {/* Кнопка Отмена */}
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
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 60,
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
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 14,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
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
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  minusBtn: {
    backgroundColor: "#fee2e2",
  },
  plusBtn: {
    backgroundColor: "#dcfce7",
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: "700",
  },
  inactiveBtn: {
    backgroundColor: "#f1f3f5",
    opacity: 0.5,
  },
  qtyText: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
  },
  activeQtyText: {
    fontWeight: "800",
    color: "#1a1a1a",
    fontSize: 18,
  },
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
  disabledElement: {
    opacity: 0.5,
  },
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
  summaryLabel: {
    color: "#abb2bf",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: "#333",
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    color: "#22c55e",
    fontSize: 22,
    fontWeight: "800",
  },
  saveBtn: {
    backgroundColor: "#1a1a1a",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  saveBtnDisabled: {
    backgroundColor: "#666",
    opacity: 0.7,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
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
  },
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
});
