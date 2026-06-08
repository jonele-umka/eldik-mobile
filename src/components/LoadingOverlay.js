import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

const LoadingOverlay = ({ visible, text = "Загрузка..." }) => {
  if (!visible) return null;
  return (
    <Modal transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.overlayText}>{text}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  overlayText: { marginTop: 10, fontWeight: "600", color: "#1a1a1a" },
});

export default LoadingOverlay;
