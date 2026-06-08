import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getExpenses, saveExpense } from "../../services/api";

export default function ExpensesScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "" });
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getExpenses();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  async function handleSave() {
    if (!newExpense.category || !newExpense.amount)
      return Alert.alert("Ошибка", "Заполните все поля");

    setSaving(true);
    try {
      await saveExpense({
        ...newExpense,
        date: date.toLocaleDateString("ru-RU"),
      });
      setNewExpense({ category: "", amount: "" });
      loadData();
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#22c55e"]}
        />
      }
    >
      <Text style={styles.title}>Расходы</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Дата</Text>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.dateText}>
            {date.toLocaleDateString("ru-RU")}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onValueChange={(event, selectedDate) => {
              if (Platform.OS === "android") setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
            onDismiss={() => setShowPicker(false)}
          />
        )}

        <Text style={styles.label}>Категория</Text>
        <TextInput
          placeholder="Например: Аренда"
          style={styles.input}
          value={newExpense.category}
          onChangeText={(t) => setNewExpense({ ...newExpense, category: t })}
        />

        <Text style={styles.label}>Сумма (сом)</Text>
        <TextInput
          placeholder="0"
          keyboardType="numeric"
          style={styles.input}
          value={newExpense.amount}
          onChangeText={(t) => setNewExpense({ ...newExpense, amount: t })}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Добавить расход</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>История операций</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#22c55e" />
      ) : (
        [...data].reverse().map((item, index) => (
          <View key={index} style={styles.card}>
            <View>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.dateMeta}>{item.date || "Недавно"}</Text>
            </View>
            <Text style={styles.amount}>
              -{Number(item.total).toLocaleString()} сом
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  scrollContent: { padding: 16, paddingBottom: 50 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: 50,
    marginBottom: 20,
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 15,
    marginTop: 10,
  },
  form: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
    marginLeft: 4,
  },
  dateBtn: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dateText: { color: "#334155", fontWeight: "600" },
  input: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  category: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  dateMeta: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  amount: { fontSize: 16, fontWeight: "800", color: "#e11d48" },
});
