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
import PRODUCTS from "../../constants/products";
import { saveReturn } from "../../services/api";

export default function ReturnsScreen() {
  const markets = Object.keys(CLIENTS);

  const [market, setMarket] = useState(markets[0]);
  const [client, setClient] = useState(CLIENTS[markets[0]][0]);
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState(""); // Добавили состояние для причины возврата
  const [loading, setLoading] = useState(false);

  const marketClients = CLIENTS[market] || [];

  async function handleSave() {
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert("Ошибка", "Пожалуйста, введите корректное количество товара");
      return;
    }

    try {
      setLoading(true);

      // Передаем все данные на сервер, включая причину возврата (reason)
      await saveReturn({
        market,
        client,
        product,
        quantity: parsedQty,
        reason: reason.trim(),
      });

      Alert.alert("Успех", "Возврат успешно сохранен");
      setQuantity("1");
      setReason(""); // Сбрасываем поле причины
    } catch (e) {
      Alert.alert("Ошибка", String(e));
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Возврат товара</Text>

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

      {/* Выбор товара */}
      <Text style={styles.label}>Товар</Text>
      <View style={[styles.pickerContainer, loading && styles.disabledElement]}>
        <Picker
          enabled={!loading}
          selectedValue={product}
          onValueChange={setProduct}
        >
          {PRODUCTS.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* Ввод количества */}
      <Text style={styles.label}>Количество</Text>
      <View style={[styles.inputWrapper, loading && styles.disabledInputWrapper]}>
        <Text style={styles.inputIcon}>🔄</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#999"
          editable={!loading}
        />
        <Text style={styles.unitText}>шт</Text>
      </View>

      {/* Ввод причины возврата */}
      <Text style={styles.label}>Причина возврата</Text>
      <TextInput
        style={[styles.reasonInput, loading && styles.disabledInput]}
        value={reason}
        onChangeText={setReason}
        placeholder="Например: брак, излишек, нерассчитали..."
        placeholderTextColor="#999"
        editable={!loading}
        multiline
      />

      {/* Кнопка отправки */}
      <TouchableOpacity
        disabled={loading}
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveText}>Сохранить возврат</Text>
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
  inputIcon: {
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
  unitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginLeft: 10,
  },
  reasonInput: {
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