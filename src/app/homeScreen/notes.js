import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import HomeButton from "../../components/HomeButton/HomeButton";
import {
  deleteNote as deleteNoteApi,
  getNotes,
  saveNote as saveNoteApi,
  toggleNote as toggleNoteApi,
  updateNote as updateNoteApi,
} from "../../services/api";

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Общие состояния для главного экрана
  const [isSavingMain, setIsSavingMain] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Состояния для модального окна (отдельно от главного)
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [isDeletingModal, setIsDeletingModal] = useState(false);

  const [title, setTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  const [selectedNote, setSelectedNote] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      const sorted = Array.isArray(data)
        ? data.sort((a, b) =>
            a.completed === b.completed ? 0 : a.completed ? 1 : -1,
          )
        : [];
      setNotes(sorted);
    } catch (error) {
      setNotes([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    loadNotes().finally(() => setLoading(false));
  }, []);

  const saveNewNote = async () => {
    if (!title.trim() || !noteText.trim())
      return Alert.alert("Ошибка", "Заполните все поля");
    setIsSavingMain(true);
    try {
      await saveNoteApi(title, noteText);
      setTitle("");
      setNoteText("");
      await loadNotes();
    } finally {
      setIsSavingMain(false);
    }
  };

  const handleToggle = async (item) => {
    setProcessingId(item.id);
    try {
      await toggleNoteApi(item.id, !item.completed);
      await loadNotes();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    setIsDeletingModal(true);
    try {
      await deleteNoteApi(id);
      setModalVisible(false);
      await loadNotes();
    } finally {
      setIsDeletingModal(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editTitle.trim() || !editText.trim())
      return Alert.alert("Ошибка", "Поля не могут быть пустыми");

    setIsSavingModal(true);

    try {
      await updateNoteApi(selectedNote.id, editTitle, editText);

      await loadNotes();

      setModalVisible(false);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось обновить заметку");
    } finally {
      setIsSavingModal(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <HomeButton />
      <Text style={styles.header}>Заметки</Text>

      <View style={[styles.inputContainer, isSavingMain && { opacity: 0.6 }]}>
        <TextInput
          style={styles.input}
          placeholder="Заголовок"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          editable={!isSavingMain}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Текст заметки..."
          value={noteText}
          placeholderTextColor="#666"
          onChangeText={setNoteText}
          multiline
          editable={!isSavingMain}
        />
        <TouchableOpacity
          style={styles.saveBtn}
          disabled={isSavingMain}
          onPress={saveNewNote}
        >
          {isSavingMain ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Добавить заметку</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<Text style={styles.empty}>Пока нет заметок</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.completed && styles.completedCard]}
            onPress={() => {
              setSelectedNote(item);
              setEditTitle(item.title);
              setEditText(item.text);
              setModalVisible(true);
            }}
          >
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => handleToggle(item)}
              disabled={processingId !== null}
            >
              {processingId === item.id ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={{ fontSize: 20 }}>
                  {item.completed ? "✅" : "⬜"}
                </Text>
              )}
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
            <Text numberOfLines={4} style={styles.cardText}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalView}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <TextInput
                style={styles.modalInputTitle}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Заголовок"
                editable={!isSavingModal && !isDeletingModal}
              />
              <View style={styles.textBorder}>
                <TextInput
                  style={styles.fullText}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Текст заметки"
                  multiline
                  editable={!isSavingModal && !isDeletingModal}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#22c55e", flex: 1, marginRight: 10 },
                  ]}
                  onPress={handleUpdateNote}
                  disabled={isSavingModal || isDeletingModal}
                >
                  {isSavingModal ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Сохранить</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#dc2626", flex: 1 },
                  ]}
                  onPress={() => handleDelete(selectedNote?.id)}
                  disabled={isSavingModal || isDeletingModal}
                >
                  {isDeletingModal ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Удалить</Text>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#64748b" }]}
                onPress={() => setModalVisible(false)}
                disabled={isSavingModal || isDeletingModal}
              >
                <Text style={styles.btnText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", padding: 15 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 20 },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    paddingVertical: 8,
  },
  textArea: { height: 80 },
  saveBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  btnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    margin: 5,
    borderRadius: 16,
    padding: 12,
    minHeight: 130,
  },
  completedCard: { opacity: 0.5 },
  checkbox: { alignSelf: "flex-end", height: 25 },
  title: { fontWeight: "700", marginBottom: 8 },
  cardText: { color: "#64748b" },
  empty: { textAlign: "center", marginTop: 50, color: "#64748b" },
  modalView: { flex: 1, padding: 25, paddingTop: 80, backgroundColor: "#fff" },
  modalInputTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
  },
  textBorder: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#fcfcfc",
  },
  fullText: { fontSize: 16, lineHeight: 24, minHeight: 100 },
  modalFooter: { marginTop: "auto" },
  buttonsRow: { flexDirection: "row", marginBottom: 10 },
  modalBtn: { padding: 15, borderRadius: 12 },
});
