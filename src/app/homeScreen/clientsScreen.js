import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getClients, saveClient } from "../../services/api";

export default function ClientsScreen() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [market, setMarket] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Безопасное распределение клиентов по рынкам
  const prepareSections = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    const groups = {};

    data.forEach((client) => {
      if (!client) return;
      // Защита: если market не пришел с сервера, пишем "Без рынка"
      const marketKey =
        client.market && typeof client.market === "string"
          ? client.market.trim()
          : "Без рынка";

      if (!groups[marketKey]) {
        groups[marketKey] = [];
      }
      groups[marketKey].push(client);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    });

    return Object.keys(groups)
      .sort()
      .map((marketName) => ({
        title: marketName,
        data: groups[marketName],
      }));
  };

  const loadClients = async () => {
    try {
      const data = await getClients();
      console.log("Полученные данные клиентов с сервера:", data); // Отладочный лог в консоль
      setSections(prepareSections(data));
    } catch (e) {
      console.error("Ошибка при загрузке клиентов:", e);
      Alert.alert("Ошибка", "Не удалось загрузить список клиентов с сервера");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const handleCreateClient = async () => {
    if (!market.trim() || !name.trim()) {
      Alert.alert("Ошибка", "Рынок и Имя клиента обязательны!");
      return;
    }
    try {
      setIsSubmitting(true);

      // Отправляем базовый набор данных (задаем дефолтный долг 0, чтобы сервер не ругался)
      const res = await saveClient({
        market: market.trim(),
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        totalDebt: 0,
      });

      if (res && res.success) {
        Alert.alert("Успешно", `Клиент ${name} создан!`);
        setMarket("");
        setName("");
        setPhone("");
        setAddress("");

        const newData = await getClients();
        setSections(prepareSections(newData));
      } else {
        Alert.alert("Ошибка сервера", res?.error || "Не удалось сохранить");
      }
    } catch (e) {
      Alert.alert("Ошибка", "Критическая ошибка отправки");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !refreshing && sections.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Загрузка базы данных...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {isSubmitting && (
        <View style={styles.topLoader}>
          <ActivityIndicator size="small" color="#22c55e" />
          <Text style={styles.topLoaderText}>
            Создание клиента и обновление базы...
          </Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item, index) =>
          item.id ? String(item.id) : String(index)
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={isSubmitting ? null : onRefresh}
            colors={["#1a1a1a"]}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.screenTitle}>Управление клиентами</Text>
            <View style={[styles.addCard, isSubmitting && { opacity: 0.6 }]}>
              <TextInput
                style={styles.input}
                placeholder="Рынок *"
                value={market}
                onChangeText={setMarket}
                editable={!isSubmitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Имя клиента *"
                value={name}
                onChangeText={setName}
                editable={!isSubmitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Телефон"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isSubmitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Адрес доставки"
                value={address}
                onChangeText={setAddress}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  isSubmitting && { backgroundColor: "#86efac" },
                ]}
                onPress={handleCreateClient}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addBtnText}>Создать нового клиента</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.marketHeader}>
            <Text style={styles.marketHeaderTitle}>🏪 Рынок: {title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.clientCard, isSubmitting && { opacity: 0.7 }]}
            disabled={isSubmitting}
            onPress={() =>
              router.push({
                // ВНИМАНИЕ: Убедись, что этот путь совпадает с твоей структурой папок в app/
                pathname: "/details/clientDetail",
                params: { clientParam: JSON.stringify(item) },
              })
            }
          >
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>👤 Клиент: {item.name}</Text>
              <Text style={styles.clientSub}>
                📞 {item.phone || "Телефон не указан"}
              </Text>
              {item.address ? (
                <Text style={styles.clientSub}>📍 {item.address}</Text>
              ) : null}
            </View>
            <Text style={styles.arrow}>✏️</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
    marginTop: 10,
  },
  addCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    elevation: 2,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
    color: "#1a1a1a",
  },
  addBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
    height: 48,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  marketHeader: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  marketHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
  },
  clientCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  clientInfo: { flex: 1, marginRight: 10 },
  clientName: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  clientSub: { fontSize: 12, color: "#666", marginTop: 3 },
  arrow: { fontSize: 16, marginLeft: 10 },
  topLoader: {
    flexDirection: "row",
    backgroundColor: "#e0f2fe",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#bae6fd",
  },
  topLoaderText: {
    marginLeft: 8,
    color: "#0369a1",
    fontWeight: "600",
    fontSize: 13,
  },
});
