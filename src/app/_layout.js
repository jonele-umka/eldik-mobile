import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ИСПРАВЛЕНО: Включаем показ шапки (headerShown: true) и пишем заголовок "Главная" */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          title: "Главная",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#f8f9fa" },
          headerTintColor: "#1a1a1a",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />

      {/* Группа экранов из Бургер-меню */}
      <Stack.Screen
        name="homeScreen/clientsScreen"
        options={{ headerShown: true, title: "База клиентов" }}
      />
      <Stack.Screen
        name="homeScreen/debtorsScreen"
        options={{ headerShown: true, title: "Журнал должников" }}
      />
      {/* <Stack.Screen
        name="homeScreen/paymentScreen"
        options={{ headerShown: true, title: "Внести платеж" }}
      /> */}
      <Stack.Screen
        name="homeScreen/returnsScreen"
        options={{ headerShown: true, title: "Оформить возврат" }}
      />
      <Stack.Screen
        name="homeScreen/expensesScreen"
        options={{ headerShown: true, title: "Расходы" }}
      />
      <Stack.Screen
        name="homeScreen/reportsScreen"
        options={{ headerShown: true, title: "Отчеты" }}
      />

      {/* Группа деталей */}
      <Stack.Screen
        name="details/createOrder"
        options={{ headerShown: true, title: "Новый заказ" }}
      />
      <Stack.Screen
        name="details/orderDetail"
        options={{ headerShown: true, title: "Детали заказа" }}
      />
      <Stack.Screen
        name="details/clientDetail"
        options={{ headerShown: true, title: "Профиль клиента" }}
      />
    </Stack>
  );
}
