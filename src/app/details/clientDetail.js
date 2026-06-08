import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  deleteClientFromServer,
  updateClientOnServer,
} from "../../services/api";

export default function ClientDetailScreen() {
  const params = useLocalSearchParams();
  const client = params.clientParam ? JSON.parse(params.clientParam) : null;

  if (!client)
    return (
      <View style={styles.center}>
        <Text>Данные клиента не получены.</Text>
      </View>
    );

  // Защита: если поля пустые в таблице, подставляем пустую строку, чтобы инпуты не ломались
  const [market, setMarket] = useState(client.market || "");
  const [name, setName] = useState(client.name || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [address, setAddress] = useState(client.address || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!market.trim() || !name.trim()) {
      Alert.alert("Ошибка", "Рынок и Имя обязательны!");
      return;
    }
    if (!client.id) {
      Alert.alert("Ошибка", "У этого клиента отсутствует внутренний ID. Обновите базу данных свайпом вниз.");
      return;
    }
    try {
      setLoading(true);
      const res = await updateClientOnServer({
        id: client.id, 
        market: market.trim(),
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      if (res && res.success) {
        Alert.alert("Успешно", "Данные клиента изменены!", [
          {
            text: "OK",
            onPress: () => router.replace("/homeScreen/clientsScreen"),
          },
        ]);
      } else {
        Alert.alert("Ошибка", res.error || "Не удалось сохранить изменения");
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось связаться с сервером обновлений");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!client.id) {
      Alert.alert("Ошибка", "Невозможно удалить клиента без ID");
      return;
    }
    Alert.alert(
      "Удаление",
      `Вы уверены, что хотите полностью удалить клиента ${name}?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteClientFromServer(client.id); 
              router.replace("/homeScreen/clientsScreen");
            } catch (e) {
              Alert.alert("Ошибка", "Не удалось удалить клиента");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Карточка клиента</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Рынок</Text>
        <TextInput
          style={styles.input}
          value={market}
          onChangeText={setMarket}
          placeholder="Укажите рынок"
        />

        <Text style={styles.label}>ФИО Клиента</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Введите имя"
        />

        <Text style={styles.label}>Телефон</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Телефон не указан"
        />

        <Text style={styles.label}>Адрес доставки</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Адрес не указан"
        />
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Сохранить карточку</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        disabled={loading}
      >
        <Text style={styles.deleteBtnText}>Удалить клиента из базы</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    paddingTop: 30,
    paddingBottom: 50,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16, color: "#1a1a1a" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    color: "#1a1a1a",
  },
  saveBtn: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    height: 54,
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  deleteBtn: {
    backgroundColor: "#fee2e2",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "700" },
});