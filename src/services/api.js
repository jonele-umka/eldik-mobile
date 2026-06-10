import axios from "axios";

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbx2GuP_69w9FC1pUc4NJ_7IRkeRKqdC01nBZ5QnhMAse8-iYCKvzRm2anrpgE_votfS/exec";

// --- РАБОТА С ЗАКАЗАМИ ---

export async function saveOrder(payload) {
  const res = await axios.post(BASE_URL, {
    action: "saveOrder",
    ...payload,
  });
  return res.data;
}

export async function updateOrderOnServer(updatedOrderData) {
  const res = await axios.post(BASE_URL, {
    action: "updateOrder",
    ...updatedOrderData,
  });
  return res.data;
}
export const deleteOrder = async (client, orderDate) => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "deleteOrder",
      client,
      orderDate,
    }),
  });

  return response.json();
};
export async function getOrders() {
  const res = await axios.get(`${BASE_URL}?action=orders&_t=${Date.now()}`);
  return res.data;
}

// --- РАБОТА С ПЛАТЕЖАМИ И ВОЗВРАТАМИ ---

export async function savePayment(payload) {
  const res = await axios.post(BASE_URL, {
    action: "savePayment",
    ...payload,
  });
  return res.data;
}

export async function saveReturn(payload) {
  const res = await axios.post(BASE_URL, {
    action: "saveReturn",
    ...payload,
  });
  return res.data;
}

// --- МОНИТОРИНГ И АНАЛИТИКА ---

export async function getDebtors() {
  const res = await axios.get(`${BASE_URL}?action=debtors&_t=${Date.now()}`);
  return res.data;
}

export async function getProduction() {
  const res = await axios.get(`${BASE_URL}?action=production&t=${Date.now()}`);

  return res.data;
}

export async function getFinance() {
  const res = await axios.get(`${BASE_URL}?action=finance&_t=${Date.now()}`);
  return res.data;
}

// --- РАБОТА С КЛИЕНТАМИ (ПЕРЕВЕДЕНО НА AXIOS) ---

export const getClients = async () => {
  try {
    const res = await axios.get(`${BASE_URL}?action=clients&_t=${Date.now()}`);
    return res.data;
  } catch (error) {
    console.error("Ошибка axios при получении клиентов:", error);
    return [];
  }
};

export const saveClient = async (clientData) => {
  const res = await axios.post(BASE_URL, {
    action: "saveClient",
    ...clientData,
  });
  return res.data;
};

export const updateClient = async (clientData) => {
  const res = await axios.post(BASE_URL, {
    action: "updateClient",
    ...clientData,
  });
  return res.data;
};

export const deleteClient = async (id) => {
  const res = await axios.post(BASE_URL, {
    action: "deleteClient",
    id,
  });
  return res.data;
};

// --- ПОЛУЧЕНИЕ ПРАЙС-ЛИСТА (ПЕРЕВЕДЕНО НА AXIOS) ---
export const getPrices = async () => {
  try {
    const res = await axios.get(`${BASE_URL}?action=prices&_t=${Date.now()}`);
    return res.data;
  } catch (error) {
    console.error("Ошибка в API при получении прайс-листа:", error);
    return [];
  }
};
export async function getExpenses() {
  const response = await fetch(`${BASE_URL}?action=expenses`);
  return response.json();
}
export async function saveExpense(data) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveExpense",
      category: data.category,
      amount: data.amount,
    }),
  });
  return response.json();
}
// Получение списка всех платежей
export async function getPayments() {
  const res = await axios.get(`${BASE_URL}?action=payments&_t=${Date.now()}`);
  return res.data;
}

export async function fetchFinanceReport() {
  const res = await axios.get(
    `${BASE_URL}?action=financeReport&_t=${Date.now()}`
  );
  return res.data;
}
export async function saveDebtReturn(data) {
  const response = await axios.post(BASE_URL, {
    action: "saveDebtReturn",
    ...data,
  });

  return response.data;
}
// --- СТАРАЯ КЛИЕНТСКАЯ СОВМЕСТИМОСТЬ (Явный экспорт функций для экранов) ---
export const saveClientOnServer = saveClient;
export const updateClientOnServer = updateClient;
export const deleteClientFromServer = deleteClient;
