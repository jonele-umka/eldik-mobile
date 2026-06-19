import { useState } from "react";
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

import { Picker } from "@react-native-picker/picker";

import CLIENTS from "../../constants/clients";
import { savePayment } from "../../services/api";

export default function PaymentScreen() {
  const markets = Object.keys(CLIENTS);

  const [market, setMarket] = useState(markets[0]);
  const [client, setClient] = useState(CLIENTS[markets[0]][0]);
  const [amount, setAmount] = useState("1000");
  const [comment, setComment] = useState(""); // Добавили состояние для комментария
  const [loading, setLoading] = useState(false);

  const marketClients = CLIENTS[market] || [];

  async function save() {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Ошибка", "Пожалуйста, введите корректную сумму");
      return;
    }

    try {
      setLoading(true);

      // Передаем market, client, amount и comment в соответствии с бэкендом
      await savePayment({
        market,
        client,
        amount: parsedAmount,
        comment: comment.trim(),
      });

      Alert.alert("Успех", "Платеж сохранен");
      setAmount("1000");
      setComment(""); // Сбрасываем комментарий после успешной отправки
    } catch (e) {
      Alert.alert("Ошибка", String(e));
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Внести платеж</Text>

      {/* Выбор рынка */}
      <Text style={styles.label}>Рынок</Text>
      <View style={[styles.pickerContainer, loading && styles.disabledElement]}>
        <Picker
          enabled={!loading}
          selectedValue={market}
          onValueChange={(value) => {
            setMarket(value);
            setClient(CLIENTS[value][0] || "");
          }}
        >
          {markets.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* Выбор клиента */}
      <Text style={styles.label}>Клиент</Text>
      <View style={[styles.pickerContainer, loading && styles.disabledElement]}>
        <Picker
          enabled={!loading}
          selectedValue={client}
          onValueChange={setClient}
        >
          {marketClients.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* Ввод суммы */}
      <Text style={styles.label}>Сумма платежа</Text>
      <View
        style={[styles.inputWrapper, loading && styles.disabledInputWrapper]}
      >
        <Text style={styles.currencyIcon}>💵</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#666"
          editable={!loading}
        />
        <Text style={styles.currencyText}>сом</Text>
      </View>

      {/* Ввод комментария */}
      <Text style={styles.label}>Комментарий</Text>
      <TextInput
        style={[styles.commentInput, loading && styles.disabledInput]}
        value={comment}
        onChangeText={setComment}
        placeholder="Например: остаток за прошлую неделю, наличные..."
        placeholderTextColor="#666"
        editable={!loading}
        multiline
      />

      {/* Кнопка сохранения */}
      <TouchableOpacity
        disabled={loading}
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={save}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveText}>Сохранить платеж</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledInputWrapper: {
    backgroundColor: "#f1f3f5",
    borderColor: "#e9ecef",
  },
  currencyIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginLeft: 10,
  },
  commentInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#1a1a1a",
    minHeight: 80,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledInput: {
    backgroundColor: "#f1f3f5",
    color: "#999",
    borderColor: "#e9ecef",
  },
  disabledElement: {
    opacity: 0.5,
  },
  saveBtn: {
    backgroundColor: "#1a1a1a",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
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
});
