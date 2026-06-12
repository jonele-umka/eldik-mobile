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

import CLIENTS from "../../constants/clients"; // Импортируем для поиска связи клиент -> рынок
import MARKETS from "../../constants/markets"; // Импортируем массив рынков
import { getDebtors, saveDebtReturn, savePayment } from "../../services/api";

export default function DebtorsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedDebtors, setGroupedDebtors] = useState({});

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);

  const [selectedDebtor, setSelectedDebtor] = useState(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [returnAmount, setReturnAmount] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getDebtors();
console.log(data)
      // Убедитесь, что data - это массив
      const onlyDebtors = (Array.isArray(data) ? data : Object.values(data))
        .filter((item) => Math.round(item.debt) > 0)
        .sort((a, b) => Number(b.debt) - Number(a.debt));
      // 1. Фильтруем только должников и сортируем по убыванию суммы долга

      // 2. Инициализируем группы на основе официального массива MARKETS
      const grouped = {};
      MARKETS.forEach((marketName) => {
        grouped[marketName] = [];
      });
      // Для клиентов, чей рынок определить не удалось
      grouped["Другие рынки"] = [];

      // 3. Распределяем должников по рынкам, используя структуру CLIENTS
      onlyDebtors.forEach((item) => {
        // Ищем, к какому рынку принадлежит данный клиент в constants/clients.js
        let foundMarket = "Другие рынки";

        for (const [marketName, clientList] of Object.entries(CLIENTS)) {
          if (clientList.includes(item.client)) {
            foundMarket = marketName;
            break;
          }
        }

        // Добавляем должника в соответствующую группу
        grouped[foundMarket].push(item);
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

      const res = await savePayment({
        client: selectedDebtor.client,
        amount,
        orderDate: selectedDebtor.lastOrderDate,
        market: selectedDebtor.market,
      });

      if (res.success) {
        Alert.alert("Успешно", "Оплата проведена");

        setPaymentModalVisible(false);
        setPaymentAmount("");

        await loadData();
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось сохранить оплату");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReturn = async () => {
    const amount = Number(returnAmount);

    if (!amount || amount <= 0) {
      Alert.alert("Ошибка", "Введите сумму");
      return;
    }

    try {
      setReturnLoading(true);

      const res = await saveDebtReturn({
        client: selectedDebtor.client,
        market: selectedDebtor.market,
        amount,
      });

      if (res.success) {
        Alert.alert("Успешно", "Возврат оформлен");

        setReturnModalVisible(false);
        setReturnAmount("");

        await loadData();
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

  // Выводим только те рынки, где реально есть хотя бы один должник
  const marketsToRender = Object.keys(groupedDebtors).filter(
    (marketName) => groupedDebtors[marketName].length > 0
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1a1a1a"]}
            tintColor="#1a1a1a"
          />
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
              {/* Красивый заголовок рынка */}
              <Text style={styles.marketHeaderTitle}>📍 {marketName}</Text>

              {/* Список должников внутри конкретного рынка */}
              {groupedDebtors[marketName].map((item, index) => (
                <View key={index} style={[styles.card, styles.activeDebtCard]}>
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
                        onPress={() => {
                          setSelectedDebtor(item);
                          setReturnAmount("");
                          setReturnModalVisible(true);
                        }}
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
        <Modal
          visible={paymentModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
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
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Сохранить оплату
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={paymentLoading}
                onPress={() => {
                  if (paymentLoading) return;

                  setPaymentModalVisible(false);
                  setPaymentAmount("");
                }}
              >
                <Text>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={returnModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Возврат: {selectedDebtor?.client}
              </Text>

              <TextInput
                style={styles.moneyInput}
                keyboardType="numeric"
                placeholder="Сумма возврата"
                value={returnAmount}
                onChangeText={setReturnAmount}
              />
              {returnLoading ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <TouchableOpacity
                  onPress={handleReturn}
                  disabled={returnLoading}
                  style={{
                    backgroundColor: "#dc2626",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Оформить возврат
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={returnLoading}
                onPress={() => {
                  if (returnLoading) return;

                  setReturnModalVisible(false);
                  setReturnAmount("");
                }}
              >
                <Text>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  marketSection: {
    marginTop: 15,
    marginBottom: 10,
  },
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
  activeDebtCard: {
    borderColor: "#fee2e2",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
    paddingBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
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
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  debtRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    marginTop: 10,
    paddingTop: 10,
    marginBottom: 0,
  },
  debtLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  debtValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  textRed: {
    color: "#ef4444",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22c55e",
  },
  spacer: {
    height: 40,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
  },

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
    marginBottom: 15,
    color: "#000",
    fontSize: 16,
  },

  cancelBtn: {
    marginTop: 10,
    alignItems: "center",
  },
});
