import { Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e9ecef",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Главная",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Заказы",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>📦</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="production"
        options={{
          title: "Производство",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>🏭</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Финансы",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>💼</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 20 },
});
