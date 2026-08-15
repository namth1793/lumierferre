// Kết nối KiotViet Public API — https://public.kiotapi.com
// Xem hướng dẫn cấu hình tại backend/.env.example

const CLIENT_ID = process.env.KIOTVIET_CLIENT_ID || '';
const CLIENT_SECRET = process.env.KIOTVIET_CLIENT_SECRET || '';
const RETAILER = process.env.KIOTVIET_RETAILER || '';
const BRANCH_ID = process.env.KIOTVIET_BRANCH_ID ? parseInt(process.env.KIOTVIET_BRANCH_ID) : null;

const TOKEN_URL = 'https://id.kiotviet.vn/connect/token';
const BASE_URL = 'https://public.kiotapi.com';

let tokenCache = { accessToken: null, expiresAt: 0 };
let branchCache = null;

function isConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && RETAILER);
}

async function getAccessToken() {
  if (!isConfigured()) {
    throw new Error('Chưa cấu hình KIOTVIET_CLIENT_ID / KIOTVIET_CLIENT_SECRET / KIOTVIET_RETAILER trong backend/.env');
  }
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) return tokenCache.accessToken;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      scopes: 'PublicApi.Access',
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`KiotViet auth thất bại (${res.status}): ${await res.text()}`);
  const data = await res.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // trừ 60s an toàn
  };
  return tokenCache.accessToken;
}

async function request(method, path, { query, body } = {}) {
  const token = await getAccessToken();
  const url = new URL(BASE_URL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url, {
    method,
    headers: {
      Retailer: RETAILER,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message || data?.responseStatus?.message || text || res.statusText;
    throw new Error(`KiotViet API lỗi (${res.status}) ${method} ${path}: ${msg}`);
  }
  return data;
}

async function fetchAllPages(path, { pageSize = 100, extraQuery = {} } = {}) {
  let currentItem = 0;
  let all = [];
  while (true) {
    const page = await request('GET', path, { query: { ...extraQuery, pageSize, currentItem } });
    const items = page?.data || [];
    all = all.concat(items);
    currentItem += items.length;
    if (items.length === 0 || items.length < pageSize || currentItem >= (page.total || 0)) break;
  }
  return all;
}

function getCategories() {
  return fetchAllPages('/categories', { pageSize: 100 });
}

function getProducts() {
  return fetchAllPages('/products', { pageSize: 100, extraQuery: { includeInventory: true } });
}

function getCustomers() {
  return fetchAllPages('/customers', { pageSize: 100 });
}

async function getBranches() {
  if (branchCache) return branchCache;
  const data = await request('GET', '/branches', { query: { pageSize: 100 } });
  branchCache = data?.data || [];
  return branchCache;
}

async function getDefaultBranchId() {
  if (BRANCH_ID) return BRANCH_ID;
  const branches = await getBranches();
  if (!branches.length) throw new Error('Không tìm thấy chi nhánh nào trên tài khoản KiotViet');
  return branches[0].id;
}

async function findCustomerByPhone(phone) {
  if (!phone) return null;
  const data = await request('GET', '/customers', { query: { contactNumber: phone, pageSize: 1 } });
  return (data?.data && data.data[0]) || null;
}

async function createCustomer({ name, phone, email, address }) {
  return request('POST', '/customers', {
    body: {
      name,
      contactNumber: phone || undefined,
      email: email || undefined,
      address: address || undefined,
    },
  });
}

async function findOrCreateCustomer({ name, phone, email, address }) {
  const existing = await findCustomerByPhone(phone);
  if (existing) return existing;
  return createCustomer({ name, phone, email, address });
}

async function createOrder({ branchId, customerId, orderDetails, description, discount = 0 }) {
  return request('POST', '/orders', {
    body: {
      branchId,
      customerId,
      purchaseDate: new Date().toISOString(),
      discount,
      description,
      orderDetails,
    },
  });
}

module.exports = {
  isConfigured,
  getAccessToken,
  getCategories,
  getProducts,
  getCustomers,
  getBranches,
  getDefaultBranchId,
  findCustomerByPhone,
  createCustomer,
  findOrCreateCustomer,
  createOrder,
};
