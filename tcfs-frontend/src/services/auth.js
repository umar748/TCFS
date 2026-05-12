const API_URL = import.meta.env.VITE_API_URL || "";

const defaultHeaders = { "Content-Type": "application/json" };
const TOKEN_KEY = "auth_token";
const USER_KEY = "user";

function readStorage(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function writeStorage(key, value) {
  if (value == null) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, value);
  localStorage.setItem(key, value);
}

function api(path) {
  return `${API_URL}${path}`;
}

export async function login({ email, password }) {
  const res = await fetch(api("/api/auth/login"), {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
}

export async function loginWithGoogle({ name, email }) {
  const res = await fetch(api("/api/auth/google-demo"), {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({
      name,
      email,
      googleId: `google-${Date.now()}`
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Google login failed");
  }

  return data;
}

export async function loginWithApple({ name, email }) {
  const res = await fetch(api("/api/auth/google-demo"), {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({
      name,
      email,
      googleId: `apple-${Date.now()}`
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Apple login failed");
  }

  return data;
}

export async function loginWithTwitter({ name, email }) {
  const res = await fetch(api("/api/auth/google-demo"), {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({
      name,
      email,
      googleId: `twitter-${Date.now()}`
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Twitter login failed");
  }

  return data;
}

export async function register({ name, email, password, role }) {
  const res = await fetch(api("/api/auth/register"), {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Registration failed");
  }

  return data;
}

export function storeToken(token) {
  if (token) writeStorage(TOKEN_KEY, token);
}

export function getToken() {
  return readStorage(TOKEN_KEY);
}

export async function me() {
  const token = getToken();

  if (!token) return null;

  const res = await fetch(api("/api/auth/me"), {
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    throw new Error('Authentication failed');
  }

  return await res.json();
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "/login";
}

export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser() {
  const userStr = readStorage(USER_KEY);

  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function setUser(user) {
  if (user) {
    writeStorage(USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
