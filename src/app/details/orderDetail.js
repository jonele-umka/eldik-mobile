import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  deleteOrder,
  getPrices,
  savePayment,
  saveReturn,
  updateOrderOnServer,
  updateOrderStatus,
} from "../../services/api";

export default function OrderDetailScreen() {
  const getDirectDriveImageUrl = (url) => {
    if (!url) return null;
    if (url.includes("drive.google.com")) {
      const match = url.match(/\/d\/([^/]+)/);
      if (match && match[1])
        return `https://docs.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };

  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);

  // Состояния модалок
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [inputPayment, setInputPayment] = useState("");

  const [selectedReturnProduct, setSelectedReturnProduct] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState("1");

  const [priceList, setPriceList] = useState([]);
  const currentOrder = params.orderParam ? JSON.parse(params.orderParam) : null;

  if (!currentOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Данные заказа не переданы.</Text>
      </View>
    );
  }
  const [status, setStatus] = useState(currentOrder.status || "Новый");
  const [items, setItems] = useState(currentOrder.items || []);
  const [paidAmount, setPaidAmount] = useState(
    Number(currentOrder.paidAmount || 0)
  );
  const [returnedAmount, setReturnedAmount] = useState(
    Number(currentOrder.returnedAmount || 0)
  );
  const toggleStatus = async () => {
    try {
      setSaving(true);

      const newStatus = status === "Доставлен" ? "Новый" : "Доставлен";

      const response = await updateOrderStatus({
        orderDate: currentOrder.orderDate,
        client: currentOrder.client,
        market: currentOrder.market,
        status: newStatus,
      });

      console.log("SERVER RESPONSE", response);

      if (response?.success) {
        setStatus(newStatus);
        Alert.alert("Успешно", `Статус изменен на "${newStatus}"`);
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось изменить статус");
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    async function loadPricesAndMerge() {
      try {
        const res = await getPrices();
        if (res && Array.isArray(res)) {
          setPriceList(res);
          setItems((prevItems) =>
            prevItems.map((item) => {
              const match = res.find((p) => p.product === item.product);
              return {
                ...item,
                image: match ? match.image : item.image || "",
                weight: match ? match.weight : item.weight || "0",
              };
            })
          );
        }
      } catch (e) {
        console.error("Не удалось загрузить прайс-лист", e);
      }
    }
    loadPricesAndMerge();
  }, []);

  const handleOpenImage = (imageUrl) => {
    if (saving) return;
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setPreviewVisible(true);
    } else {
      Alert.alert("Информация", "У этого товара нет изображения.");
    }
  };

  const handleQuantityChange = (index, value) => {
    if (saving) return;
    const updatedItems = [...items];
    updatedItems[index].quantity = value;
    const cleanPrice = String(updatedItems[index].price)
      .replace(/[\s\u00a0]/g, "")
      .replace(",", ".");
    const priceNum = parseFloat(cleanPrice) || 0;
    const qtyNum = parseInt(value) || 0;
    updatedItems[index].total = (priceNum * qtyNum).toString();
    setItems(updatedItems);
  };

  const handleCommentChange = (index, value) => {
    if (saving) return;
    const updatedItems = [...items];
    updatedItems[index].comment = value;
    setItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    if (saving) return;
    Alert.alert("Удаление", `Удалить ${items[index].product} из заказа?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => setItems(items.filter((_, i) => i !== index)),
      },
    ]);
  };

  const handleAddItem = (selectedProduct) => {
    if (saving) return;
    if (items.some((i) => i.product === selectedProduct.product)) {
      Alert.alert("Внимание", "Этот товар уже добавлен в заказ.");
      return;
    }
    const newItem = {
      id: "NEW_" + Date.now(),
      product: selectedProduct.product,
      price: selectedProduct.price.toString(),
      weight: selectedProduct.weight,
      image: selectedProduct.image,
      quantity: "1",
      total: selectedProduct.price.toString(),
      comment: "",
    };
    setItems([newItem, ...items]);
    setModalVisible(false);
  };

  const calculateTotalSum = () => {
    return items.reduce((sum, item) => {
      const cleanTotal = String(item.total)
        .replace(/[\s\u00a0]/g, "")
        .replace(",", ".");
      return sum + (parseFloat(cleanTotal) || 0);
    }, 0);
  };

  const totalSum = calculateTotalSum();
  const netOrderSum = totalSum - returnedAmount;
  const currentDebt = netOrderSum - paidAmount;

  // ОПЛАТА С ИНДИКАТОРОМ ВНУТРИ КНОПКИ
  const handleAddPayment = async () => {
    const amount = parseFloat(inputPayment);
    if (!amount || amount <= 0) {
      Alert.alert("Ошибка", "Введите корректную сумму внесения денег");
      return;
    }
    try {
      setSaving(true);
      const res = await savePayment({
        client: currentOrder.client,
        amount: amount,
        orderDate: currentOrder.orderDate,
        market: currentOrder.market,
      });
      if (res && res.success) {
        setPaidAmount((prev) => prev + amount);
        setInputPayment("");
        setPaymentModalVisible(false);
        Alert.alert("Успешно", "Внесенная сумма добавлена к заказу!");
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось зафиксировать платеж");
    } finally {
      setSaving(false);
    }
  };

  // ВОЗВРАТ С ИНДИКАТОРОМ ВНУТРИ КНОПКИ
  const handleAddReturn = async () => {
    if (!selectedReturnProduct) {
      Alert.alert("Ошибка", "Выберите товар для возврата");
      return;
    }
    const qty = parseInt(returnQuantity);
    if (!qty || qty <= 0) {
      Alert.alert("Ошибка", "Укажите корректное количество");
      return;
    }

    const cleanPrice =
      parseFloat(
        String(selectedReturnProduct.price)
          .replace(/[\s\u00a0]/g, "")
          .replace(",", ".")
      ) || 0;
    const returnSum = qty * cleanPrice;

    // ИСПРАВЛЕНО: Возврат не может превышать чистую текущую стоимость заказа
    if (returnSum > netOrderSum) {
      Alert.alert(
        "Ошибка",
        "Сумма возврата превышает общую стоимость доступных товаров в чеке!"
      );
      return;
    }

    try {
      setSaving(true);
      const res = await saveReturn({
        orderDate: currentOrder.orderDate,
        client: currentOrder.client,
        market: currentOrder.market,
        product: selectedReturnProduct.product,
        quantity: qty,
        price: cleanPrice,
        amount: returnSum,
      });
      if (res && res.success) {
        setReturnedAmount((prev) => prev + returnSum);
        setSelectedReturnProduct(null);
        setReturnQuantity("1");
        setReturnModalVisible(false);
        Alert.alert("Успешно", "Возврат оформлен!");
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось оформить возврат");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (items.length === 0) {
      Alert.alert("Ошибка", "В заказе должен быть как минимум один товар.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        orderDate: currentOrder.orderDate,
        client: currentOrder.client,
        market: currentOrder.market,
        deliveryDate: currentOrder.deliveryDate,
        items: items,
      };
      const response = await updateOrderOnServer(payload);
      if (response && response.success) {
        Alert.alert("Успешно", "Изменения сохранены!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось обновить структуру заказа.");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteOrder = (order) => {
    Alert.alert("Удаление заказа", `Удалить заказ клиента "${order.client}"?`, [
      {
        text: "Отмена",
        style: "cancel",
      },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);

            const result = await deleteOrder(order.client, order.orderDate);

            if (result.success) {
              Alert.alert("Успешно", "Заказ удален", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } else {
              Alert.alert("Ошибка", result.error || "Не удалось удалить заказ");
            }
          } catch (e) {
            Alert.alert("Ошибка", "Не удалось удалить заказ");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <ScrollView
        pointerEvents={saving ? "none" : "auto"}
        style={[styles.container, saving && styles.disabledElement]}
        editable={!saving}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.statusButton,
            {
              backgroundColor: status === "Доставлен" ? "#16a34a" : "#f59e0b",
            },
          ]}
          onPress={toggleStatus}
          disabled={saving}
        >
          <Text style={styles.statusButtonText}>
            {status === "Доставлен" ? "✅ Доставлен" : "🚚 Новый"}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCard}>
          <Text style={styles.clientTitle}>{currentOrder.client}</Text>
          <Text style={styles.orderDateText}>
            Дата записи: {currentOrder.orderDate}
          </Text>
        </View>

        {/* НОВЫЙ БЛОК ДЕТАЛИЗАЦИИ ФИНАНСОВ */}
        <View style={styles.detailsFinCard}>
          <View style={styles.finDetailRow}>
            <Text style={styles.finDetailLabel}>Сумма чека:</Text>
            <Text style={styles.finDetailValue}>
              {netOrderSum.toLocaleString()} сом
            </Text>
          </View>
          <View style={styles.finDetailRow}>
            <Text style={styles.finDetailLabel}>Оплачено:</Text>
            <Text style={[styles.finDetailValue, { color: "#16a34a" }]}>
              {paidAmount.toLocaleString()} сом
            </Text>
          </View>
          <View
            style={[
              styles.finDetailRow,
              {
                borderTopWidth: 1,
                borderColor: "#eee",
                paddingTop: 8,
                marginTop: 4,
              },
            ]}
          >
            <Text
              style={[
                styles.finDetailLabel,
                { fontWeight: "700", color: "#1a1a1a" },
              ]}
            >
              Остаток (Долг):
            </Text>
            <Text
              style={[
                styles.finDetailValue,
                {
                  color: currentDebt > 0 ? "#dc2626" : "#16a34a",
                  fontSize: 16,
                },
              ]}
            >
              {Math.round(Math.max(0, currentDebt)).toLocaleString()} сом
            </Text>
          </View>
        </View>

        {/* ПАНЕЛЬ УПРАВЛЕНИЯ ДЕНЬГАМИ */}
        <View style={styles.financeActionRow}>
          <TouchableOpacity
            style={[styles.finBtn, { backgroundColor: "#16a34a" }]}
            onPress={() => setPaymentModalVisible(true)}
            disabled={saving}
          >
            <Text style={styles.finBtnText}>Внести оплату</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.finBtn, { backgroundColor: "#dc2626" }]}
            onPress={() => setReturnModalVisible(true)}
            disabled={saving}
          >
            <Text style={styles.finBtnText}>Оформить возврат</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Информация о доставке</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            🏪 <Text style={{ fontWeight: "700" }}>Рынок:</Text>{" "}
            {currentOrder.market}
          </Text>
          <Text style={styles.infoText}>
            🚚 <Text style={{ fontWeight: "700" }}>Дата доставки:</Text>{" "}
            {currentOrder.deliveryDate}
          </Text>

          {/* Исправленный блок отображения возврата */}
          {returnedAmount > 0 && (
            <View
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: "#f1f3f5",
              }}
            >
              <Text
                style={[
                  styles.infoText,
                  { color: "#dc2626", fontWeight: "700" },
                ]}
              >
                🔄 Сумма возврата: {returnedAmount.toLocaleString()} сом
              </Text>
              <Text style={{ fontSize: 11, color: "#999" }}>
                * Деньги за возвращенные товары уже вычтены из итоговой суммы
                заказа.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Товары в заказе</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            disabled={saving}
          >
            <Text style={styles.addButtonText}>+ Добавить товар</Text>
          </TouchableOpacity>
        </View>

        {items.map((goods, index) => (
          <View key={index} style={styles.goodsCard}>
            <View style={styles.goodsCardHeader}>
              <View style={styles.goodsTitleRow}>
                <TouchableOpacity
                  onPress={() => handleOpenImage(goods.image)}
                  disabled={saving}
                >
                  <Image
                    source={
                      goods.image
                        ? { uri: getDirectDriveImageUrl(goods.image) }
                        : require("../../../assets/images/icon.png")
                    }
                    style={styles.goodsImage}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goodsName}>{goods.product}</Text>
                  <Text style={styles.goodsWeightText}>
                    Вес/Фасовка: {goods.weight} кг
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveItem(index)}
                style={styles.removeTouch}
                disabled={saving}
              >
                <Text style={styles.removeText}>❌</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.goodsEditRow}>
              <View>
                <Text style={styles.subLabel}>Количество (шт):</Text>
                <TextInput
                  style={[styles.smallInput, saving && styles.disabledInput]}
                  value={goods.quantity.toString()}
                  keyboardType="numeric"
                  editable={!saving}
                  onChangeText={(val) => handleQuantityChange(index, val)}
                />
              </View>
              <View
                style={{ alignItems: "flex-end", justifyContent: "center" }}
              >
                <Text style={styles.priceText}>{goods.price} сом / шт</Text>
                <Text style={styles.totalItemText}>
                  Итого: {parseFloat(goods.total || 0).toLocaleString()} сом
                </Text>
              </View>
            </View>

            <Text style={[styles.subLabel, { marginTop: 12 }]}>
              Комментарий к товару:
            </Text>
            <TextInput
              style={[styles.itemCommentInput, saving && styles.disabledInput]}
              value={goods.comment}
              editable={!saving}
              placeholder="Особые пожелания..."
              onChangeText={(val) => handleCommentChange(index, val)}
            />
          </View>
        ))}

        {/* КНОПКА СОХРАНЕНИЯ ИЗМЕНЕНИЙ В СТИЛЕ HOME С ИНДИКАТОРОМ ВНУТРИ */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveBtnDisabled]}
          onPress={handleSaveChanges}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Сохранить изменения</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteOrder(currentOrder)}
          disabled={saving}
        >
          <Text style={styles.deleteText}>Удалить</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* МОДАЛКА ОПЛАТЫ */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setPaymentModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Внесение наличных денег</Text>
            <TextInput
              style={[styles.moneyInput, saving && styles.disabledInput]}
              placeholder="Введите сумму в сомах"
              keyboardType="numeric"
              editable={!saving}
              value={inputPayment}
              onChangeText={setInputPayment}
            />
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: "#16a34a", marginTop: 10 },
                saving && styles.saveBtnDisabled,
              ]}
              onPress={handleAddPayment}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Провести оплату</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setPaymentModalVisible(false)}
              disabled={saving}
            >
              <Text style={styles.closeModalButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* МОДАЛКА ВОЗВРАТА ТОВАРОВ */}
      <Modal
        visible={returnModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setReturnModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Оформление возврата товара</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: 12 }}>
              {items.map((item, idx) => {
                const isSelected =
                  selectedReturnProduct?.product === item.product;
                return (
                  <TouchableOpacity
                    disabled={saving}
                    key={idx}
                    style={[
                      styles.returnProductSelectItem,
                      isSelected && {
                        backgroundColor: "#fee2e2",
                        borderColor: "#dc2626",
                      },
                    ]}
                    onPress={() => setSelectedReturnProduct(item)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600" }}>
                      {item.product}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      Куплено: {item.quantity} шт. | {item.price} сом
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {saving && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Выполняется операция...</Text>
              </View>
            )}
            {selectedReturnProduct && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.subLabel}>
                  Количество штук для возврата:
                </Text>
                <TextInput
                  style={[styles.moneyInput, saving && styles.disabledInput]}
                  placeholder="Количество (шт)"
                  keyboardType="numeric"
                  editable={!saving}
                  value={returnQuantity}
                  onChangeText={setReturnQuantity}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: "#dc2626" },
                saving && styles.saveBtnDisabled,
              ]}
              onPress={handleAddReturn}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Подтвердить возврат</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setReturnModalVisible(false);
                setSelectedReturnProduct(null);
              }}
              disabled={saving}
            >
              <Text style={styles.closeModalButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ОСТАЛЬНЫЕ МОДАЛКИ (ВЫБОР ТОВАРА И КАРТИНКА) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите товар</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {priceList.map((product, pIdx) => (
                <View key={pIdx} style={styles.productSelectItem}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    onPress={() => handleAddItem(product)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", flex: 1 }}>
                      {product.product}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700" }}>
                      {product.price} сом
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewVisible(false)}
        >
          <Image
            source={{ uri: getDirectDriveImageUrl(selectedImage) }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
      {saving && (
        <View style={styles.globalLoader}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.globalLoaderText}>Загрузка...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorText: { color: "#ff3333", fontSize: 16, fontWeight: "600" },
  headerCard: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 20,
  },
  clientTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  orderDateText: { fontSize: 12, color: "#abb2bf", marginTop: 4 },
  detailsFinCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderTopWidth: 0,
  },
  finDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  finDetailLabel: { fontSize: 13, color: "#666", fontWeight: "600" },
  finDetailValue: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  financeActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  finBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  finBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a1a1a",
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoText: { fontSize: 14, color: "#333", marginBottom: 4 },
  addButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  goodsCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  goodsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  goodsTitleRow: { flexDirection: "row", flex: 1, alignItems: "center" },
  goodsImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  goodsName: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  goodsWeightText: { fontSize: 12, color: "#666", marginTop: 2 },
  removeTouch: { padding: 4 },
  removeText: { fontSize: 14 },
  goodsEditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  subLabel: { fontSize: 11, color: "#888", marginBottom: 4, fontWeight: "600" },
  smallInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 8,
    width: 75,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "700",
  },
  moneyInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
    width: "100%",
    marginBottom: 10,
  },
  itemCommentInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: "#1a1a1a",
  },
  priceText: { fontSize: 12, color: "#888", fontWeight: "500" },
  totalItemText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  saveBtnDisabled: { backgroundColor: "#a3e635", opacity: 0.6 },
  disabledElement: { opacity: 0.6 },
  disabledInput: { backgroundColor: "#e9ecef", color: "#999" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowRadius: 10,
    shadowOpacity: 0.1,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  productSelectItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeModalButton: {
    marginTop: 10,
    backgroundColor: "#e2e8f0",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeModalButtonText: { color: "#334155", fontWeight: "700" },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: { width: "100%", height: "100%" },
  returnProductSelectItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 6,
  },
  deleteButton: { marginTop: 20 },

  deleteText: {
    fontSize: 20,
    color: "#ff3333",
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  statusButton: {
    marginBottom: 15,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  statusButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  globalLoader: {
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

  globalLoaderText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
});
