import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

export default function Loader({ title, loading, onPress }) {
  return (
    <TouchableOpacity
      disabled={loading}
      onPress={onPress}
      style={{
        backgroundColor: "#111",
        padding: 16,
        borderRadius: 12,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
