import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
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
  addOrderRow,
  deleteOrder,
  getClients,
  getPrices,
  getReturns,
  savePayment,
  saveReturn,
  updateOrderOnServer,
  updateOrderStatus,
} from "../../services/api";
export default function OrderDetailScreen() {
  async function handlePrintInvoice() {
    try {
      setSaving(true);

      const itemRows = items
        .map((item, index) => {
          const qty = parseInt(item.quantity) || 0;
          const price = getItemPrice(item.price);
          const promo = calculatePromo(qty);
          const total = promo.paidQty * price;

          return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.product}</td>
            <td style="text-align:center">${qty}</td>
            <td style="text-align:center; color:#16a34a">
              ${
                promo.giftQty > 0
                  ? `+${promo.giftQty} 🎁<br/><small>итого: ${promo.finalQty}</small>`
                  : "—"
              }
            </td>
            <td style="text-align:right">${price} сом</td>
            <td style="text-align:right; font-weight:bold">${total.toLocaleString()} сом</td>
            <td style="font-size:11px;color:#666">${item.comment || "—"}</td>
          </tr>
        `;
        })
        .join("");

      const totalSum = items.reduce((sum, item) => {
        const qty = parseInt(item.quantity) || 0;
        const promo = calculatePromo(qty);
        return sum + promo.paidQty * getItemPrice(item.price);
      }, 0);

      const totalBoxes = items.reduce(
        (s, i) => s + (parseInt(i.quantity) || 0),
        0
      );
      const totalGifts = items.reduce((s, i) => {
        return s + calculatePromo(parseInt(i.quantity) || 0).giftQty;
      }, 0);

      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, "0")}.${String(
        today.getMonth() + 1
      ).padStart(2, "0")}.${today.getFullYear()}`;
      const debt = Math.max(0, totalSum - returnedAmount - paidAmount);

      const html = `
        <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; font-size: 13px; }
            h2 { text-align: center; font-size: 20px; margin-bottom: 4px; letter-spacing: 2px; }
            .subtitle { text-align: center; color: #888; margin-bottom: 24px; font-size: 12px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
            .info-block { flex: 1; }
            .info-row { margin-bottom: 8px; }
            .info-label { color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .info-value { font-weight: bold; font-size: 14px; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #1a1a1a; color: #fff; padding: 9px 7px; font-size: 11px; text-align: left; }
            td { padding: 8px 7px; border-bottom: 1px solid #e9ecef; font-size: 12px; vertical-align: middle; }
            tr:nth-child(even) td { background: #f8f9fa; }
            .total-row td { font-weight: bold; border-top: 2px solid #1a1a1a; background: #f0fdf4 !important; font-size: 13px; }
            .summary { margin-top: 10px; padding: 16px; border: 2px solid #1a1a1a; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
            .summary-divider { border-top: 1px solid #e9ecef; margin: 8px 0; }
            .summary-total-label { font-size: 15px; font-weight: bold; }
            .summary-total-value { font-size: 18px; font-weight: bold; color: #dc2626; }
            .paid-value { color: #16a34a; font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .sig-block { width: 44%; }
            .sig-line { border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 11px; color: #666; }
            .footer { text-align: center; color: #bbb; font-size: 10px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h2>НАКЛАДНАЯ</h2>
          <div class="subtitle">
            № ${String(currentOrder.orderId || "").slice(
              -8
            )} &nbsp;|&nbsp; Дата записи: ${
        currentOrder.orderDate?.split(" ")[0] || dateStr
      }
          </div>
  
          <div class="info-grid">
            <div class="info-block">
              <div class="info-row">
                <div class="info-label">Клиент</div>
                <div class="info-value">${client}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Рынок</div>
                <div class="info-value">${market}</div>
              </div>
            </div>
            <div class="info-block">
              <div class="info-row">
                <div class="info-label">Дата доставки</div>
                <div class="info-value">${deliveryDate}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Статус</div>
                <div class="info-value">${status}</div>
              </div>
            </div>
          </div>
  
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Товар</th>
                <th style="text-align:center">Кол-во</th>
                <th style="text-align:center">Подарок</th>
                <th style="text-align:right">Цена</th>
                <th style="text-align:right">Сумма</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr class="total-row">
                <td colspan="2">ИТОГО</td>
                <td style="text-align:center">${totalBoxes} шт</td>
                <td style="text-align:center; color:#16a34a">${
                  totalGifts > 0 ? `+${totalGifts} шт` : "—"
                }</td>
                <td></td>
                <td style="text-align:right">${totalSum.toLocaleString()} сом</td>
                <td></td>
              </tr>
            </tbody>
          </table>
  
          <div class="summary">
            <div class="summary-row">
              <span>Сумма заказа:</span>
              <span>${totalSum.toLocaleString()} сом</span>
            </div>
            ${
              returnedAmount > 0
                ? `
            <div class="summary-row">
              <span>Возврат товара:</span>
              <span style="color:#ea580c">−${returnedAmount.toLocaleString()} сом</span>
            </div>`
                : ""
            }
            <div class="summary-row">
              <span>Оплачено:</span>
              <span class="paid-value">+${paidAmount.toLocaleString()} сом</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row">
              <span class="summary-total-label">Остаток к оплате:</span>
              <span class="summary-total-value">${debt.toLocaleString()} сом</span>
            </div>
          </div>
  
          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line">Выдал: _______________________</div>
            </div>
            <div class="sig-block">
              <div class="sig-line">Получил (подпись): _______________________</div>
            </div>
          </div>
  
          <div class="footer">Распечатано: ${dateStr}</div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Накладная — ${client}`,
      });
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось создать накладную: " + e.message);
    } finally {
      setSaving(false);
    }
  }
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
  const [clients, setClients] = useState([]);
  const [returnedByProduct, setReturnedByProduct] = useState({});
  let currentOrder = null;

  try {
    currentOrder = params.orderParam ? JSON.parse(params.orderParam) : null;
  } catch (e) {
    console.log("Ошибка парсинга заказа", e);
  }

  const [marketModalVisible, setMarketModalVisible] = useState(false);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [market, setMarket] = useState(currentOrder?.market || "");
  const [client, setClient] = useState(currentOrder?.client || "");
  const [deliveryDate, setDeliveryDate] = useState(
    currentOrder?.deliveryDate || ""
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  if (!currentOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Данные заказа не переданы.</Text>
      </View>
    );
  }
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();

      setDeliveryDate(`${day}.${month}.${year}`);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await getClients();

      setClients(data || []);

      // если рынок пустой
      if (!market && data?.length) {
        const firstMarket = data[0].market;

        setMarket(firstMarket);

        const firstClient = data.find((c) => c.market === firstMarket);

        if (firstClient) {
          setClient(firstClient.name);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  const [status, setStatus] = useState(currentOrder?.status || "Новый");

  const [items, setItems] = useState(currentOrder?.items || []);

  const [paidAmount, setPaidAmount] = useState(
    Number(currentOrder?.paidAmount || 0)
  );

  const [returnedAmount, setReturnedAmount] = useState(
    Number(currentOrder?.returnedAmount || 0)
  );

  const toggleStatus = async () => {
    try {
      setSaving(true);

      const newStatus = status === "Доставлен" ? "Новый" : "Доставлен";

      const response = await updateOrderStatus({
        orderId: currentOrder.orderId,
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
    const qtyNum = parseInt(value) || 0;

    const promo = calculatePromo(qtyNum);

    const priceNum = getItemPrice(updatedItems[index].price);

    updatedItems[index].giftQty = promo.giftQty;
    updatedItems[index].paidQty = promo.paidQty;
    updatedItems[index].finalQty = promo.finalQty;

    updatedItems[index].total = (promo.paidQty * priceNum).toString();
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
    const promo = calculatePromo(1);

    const newItem = {
      id: "NEW_" + Date.now(),
      product: selectedProduct.product,
      price: selectedProduct.price.toString(),
      weight: selectedProduct.weight,
      image: selectedProduct.image,

      quantity: "1",

      giftQty: promo.giftQty,
      paidQty: promo.paidQty,
      finalQty: promo.finalQty,

      total: (promo.paidQty * getItemPrice(selectedProduct.price)).toString(),

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
  const marketClients = clients.filter((c) => c.market === market);
  const selectMarket = (selectedMarket) => {
    setMarket(selectedMarket);
    setItems((prev) =>
      prev.map((item) => {
        const qty = parseInt(item.quantity) || 0;

        const promo = calculatePromo(qty);

        const price =
          selectedMarket === "Аламедин"
            ? Number(item.price) + 20
            : Number(item.price);

        return {
          ...item,
          giftQty: promo.giftQty,
          paidQty: promo.paidQty,
          finalQty: promo.finalQty,
          total: (promo.paidQty * price).toString(),
        };
      })
    );
    const firstClient = clients.find((c) => c.market === selectedMarket);

    setClient(firstClient?.name || "");

    setMarketModalVisible(false);
  };

  // ОПЛАТА С ИНДИКАТОРОМ ВНУТРИ КНОПКИ
  const handleAddPayment = async () => {
    const amount = parseFloat(inputPayment);
    if (!amount || amount <= 0) {
      Alert.alert("Ошибка", "Введите корректную сумму внесения денег");
      return;
    }
    if (amount > currentDebt) {
      Alert.alert("Ошибка", "Сумма оплаты превышает остаток долга");
      return;
    }

    try {
      setSaving(true);
      const res = await savePayment({
        orderId: currentOrder.orderId,
        client: currentOrder.client,
        amount,
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
    const remaining =
      selectedReturnProduct.remaining ??
      (parseInt(selectedReturnProduct.quantity) || 0);
    if (qty > remaining) {
      Alert.alert("Ошибка", `Можно вернуть не более ${remaining} шт`);
      return;
    }

    const cleanPrice = getItemPrice(selectedReturnProduct.price);
    const returnSum = cleanPrice * qty;

    try {
      setSaving(true);
      const res = await saveReturn({
        orderId: currentOrder.orderId,
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

      const results = await Promise.all(
        items.map((item) => {
          const qty = parseInt(item.quantity) || 0;
          const promo = calculatePromo(qty);
          const preparedItem = {
            product: item.product,
            price: Number(item.price),
            quantity: qty,
            giftQty: promo.giftQty,
            paidQuantity: promo.paidQty,
            finalQuantity: promo.finalQty,
            total: promo.paidQty * getItemPrice(item.price),
            comment: item.comment || "",
          };

          const isNew = !item.id || String(item.id).startsWith("NEW_");

          if (isNew) {
            // новый товар — добавляем строку к существующему заказу
            return addOrderRow({
              orderId: currentOrder.orderId,
              orderDate: currentOrder.orderDate,
              client,
              market,
              deliveryDate,
              status,
              items: [preparedItem],
            });
          } else {
            // существующий товар — обновляем строку
            return updateOrderOnServer({
              rowId: item.id,
              orderId: currentOrder.orderId,
              orderDate: currentOrder.orderDate,
              client,
              market,
              deliveryDate,
              status,
              items: [preparedItem],
            });
          }
        })
      );

      const allSuccess = results.every((r) => r?.success);
      if (allSuccess) {
        Alert.alert("Успешно", "Изменения сохранены!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        const failed = results.find((r) => !r?.success);
        Alert.alert("Ошибка", failed?.error || "Неизвестная ошибка");
      }
    } catch (e) {
      console.log("CATCH", e);
      Alert.alert("Ошибка", "Не удалось сохранить заказ.");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteOrder = (order) => {
    console.log(order);
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

            const result = await deleteOrder(currentOrder.orderId);

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
  function calculatePromo(qty) {
    const giftQty = Math.floor(qty / 10);

    return {
      giftQty,
      finalQty: qty + giftQty,
      paidQty: qty,
    };
  }
  function getItemPrice(price) {
    const basePrice =
      parseFloat(
        String(price)
          .replace(/[\s\u00a0]/g, "")
          .replace(",", ".")
      ) || 0;

    return market === "Аламедин" ? basePrice + 20 : basePrice;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <ScrollView
        pointerEvents={saving ? "none" : "auto"}
        style={[styles.container, saving && styles.disabledElement]}
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
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setMarketModalVisible(true)}
          >
            <Text style={styles.selectText}>🏪 Рынок: {market}</Text>
          </TouchableOpacity>

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
            onPress={async () => {
              setReturnModalVisible(true);
              try {
                const allReturns = await getReturns();
                const map = {};
                (Array.isArray(allReturns) ? allReturns : [])
                  .filter(
                    (r) =>
                      r.client?.trim().toLowerCase() ===
                      currentOrder.client?.trim().toLowerCase()
                  )
                  .forEach((r) => {
                    const p = r.product?.trim();
                    if (!p) return;
                    map[p] = (map[p] || 0) + Number(r.quantity || 0);
                  });
                setReturnedByProduct(map);
              } catch (e) {
                console.log(e);
              }
            }}
            disabled={saving}
          >
            <Text style={styles.finBtnText}>Оформить возврат</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Информация о доставке</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setClientModalVisible(true)}
          >
            <Text style={styles.selectText}>👤 Клиент: {client}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectText}>
              📅 Дата доставки: {deliveryDate || "Выберите дату"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={
                deliveryDate
                  ? new Date(deliveryDate.split(".").reverse().join("-"))
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
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
          <View key={goods.id} style={styles.goodsCard}>
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
                {goods.giftQty > 0 && (
                  <>
                    <Text
                      style={{
                        color: "#16a34a",
                        fontWeight: "700",
                        marginTop: 4,
                      }}
                    >
                      🎁 Подарок: {goods.giftQty}
                    </Text>

                    <Text
                      style={{
                        color: "#666",
                        fontSize: 12,
                      }}
                    >
                      Всего выдача: {goods.finalQty}
                    </Text>
                  </>
                )}
              </View>
              <View
                style={{ alignItems: "flex-end", justifyContent: "center" }}
              >
                <Text style={styles.priceText}>
                  {getItemPrice(goods.price)} сом / шт
                </Text>
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
          style={[
            styles.saveButton,
            { backgroundColor: "#2563eb", marginTop: 10 },
          ]}
          onPress={handlePrintInvoice}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>🖨️ Распечатать накладную</Text>
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
              {items.map((item) => {
                const alreadyReturned =
                  returnedByProduct[item.product?.trim()] || 0;
                const purchasedQty = parseInt(item.quantity) || 0;
                const remaining = purchasedQty - alreadyReturned;
                const isFullyReturned = remaining <= 0;
                const isSelected =
                  selectedReturnProduct?.product === item.product;

                return (
                  <TouchableOpacity
                    disabled={saving || isFullyReturned}
                    key={item.id || item.product}
                    style={[
                      styles.returnProductSelectItem,
                      isSelected && {
                        backgroundColor: "#fee2e2",
                        borderColor: "#dc2626",
                      },
                      isFullyReturned && {
                        backgroundColor: "#f8f9fa",
                        opacity: 0.5,
                      },
                    ]}
                    onPress={() => {
                      setSelectedReturnProduct({ ...item, remaining });
                      setReturnQuantity("1");
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: isFullyReturned ? "#999" : "#1a1a1a",
                        }}
                      >
                        {item.product}
                      </Text>
                      {isFullyReturned ? (
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#dc2626",
                            fontWeight: "700",
                          }}
                        >
                          возвращён
                        </Text>
                      ) : (
                        <View
                          style={{
                            backgroundColor: "#f0fdf4",
                            borderWidth: 1,
                            borderColor: "#86efac",
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: "#16a34a",
                            }}
                          >
                            ещё {remaining} шт
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      Куплено: {purchasedQty} шт.
                      {alreadyReturned > 0
                        ? ` · возвращено: ${alreadyReturned} шт`
                        : ""}{" "}
                      | {item.price} сом
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {saving && (
              <View style={styles.globalLoader}>
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
                  onChangeText={(val) => {
                    const num = parseInt(val) || 0;
                    const max =
                      selectedReturnProduct?.remaining ??
                      parseInt(selectedReturnProduct?.quantity) ??
                      0;
                    setReturnQuantity(num > max ? String(max) : val);
                  }}
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
      <Modal visible={marketModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите рынок</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {[...new Set(clients.map((c) => c.market).filter(Boolean))].map(
                (item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.selectItem}
                    onPress={() => selectMarket(item)}
                  >
                    <Text style={styles.selectItemText}>{item}</Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setMarketModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={clientModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите клиента</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {marketClients.map((item) => (
                <TouchableOpacity
                  key={item.id || item.name}
                  style={styles.selectItem}
                  onPress={() => {
                    setClient(item.name);
                    setClientModalVisible(false);
                  }}
                >
                  <Text style={styles.selectItemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setClientModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
              {priceList.map((product) => (
                <View key={product.product} style={styles.productSelectItem}>
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
  // loadingOverlay: {
  //   position: "absolute",
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: "rgba(0,0,0,0.55)",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   zIndex: 9999,
  // },

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
  selectField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  selectText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  selectItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  selectItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});
