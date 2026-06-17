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
export const deleteOrder = async (orderId) => {
  const response = await axios.post(BASE_URL, {
    action: "deleteOrder",
    orderId,
  });

  return response.data;
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
  const res = await axios.get(`${BASE_URL}?action=production&_t=${Date.now()}`);

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
  const res = await axios.get(`${BASE_URL}?action=expenses&_t=${Date.now()}`);
  return res.data;
}

export async function saveExpense(data) {
  const res = await axios.post(BASE_URL, {
    action: "saveExpense",
    category: data.category,
    amount: data.amount,
    market: data.market,
    comment: data.comment,
  });
  return res.data;
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
export const updateOrderStatus = async ({ orderId, status }) => {
  const res = await axios.post(BASE_URL, {
    action: "updateStatus",
    orderId,
    status,
  });

  return res.data;
};
export async function getAnalytics() {
  const res = await axios.get(`${BASE_URL}?action=analytics`);

  return res.data;
}
export const fetchAnalyticsMonths = async () => {
  const res = await axios.get(`${BASE_URL}?action=analyticsMonths`);

  return res.data;
};
export async function addOrderRow(data) {
  const res = await axios.post(BASE_URL, {
    action: "addOrderRow",
    ...data,
  });
  return res.data;
}
export async function getReturns() {
  const res = await axios.get(`${BASE_URL}?action=returns&_t=${Date.now()}`);
  return res.data;
}
// --- СТАРАЯ КЛИЕНТСКАЯ СОВМЕСТИМОСТЬ (Явный экспорт функций для экранов) ---
export const saveClientOnServer = saveClient;
export const updateClientOnServer = updateClient;
export const deleteClientFromServer = deleteClient;
