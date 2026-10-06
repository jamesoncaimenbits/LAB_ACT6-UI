const BASE = import.meta.env.VITE_API_URL;
const KEY = 'tokens';

export const getTokens = () => JSON.parse(localStorage.getItem(KEY) || 'null');
const saveTokens = (t) => localStorage.setItem(KEY, JSON.stringify(t));
export const clearTokens = () => localStorage.removeItem(KEY);

async function send(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function refresh() {
  const t = getTokens();
  if (!t?.refresh_token) return false;
  const { res, data } = await send('/api/refresh', {
    method: 'POST',
    body: { refresh_token: t.refresh_token },
  });
  if (!res.ok || !data.tokens) return false;
  saveTokens(data.tokens);
  return true;
}

export async function login(username, password) {
  const { res, data } = await send('/api/login', {
    method: 'POST',
    body: { username, password },
  });
  const t = data.tokens || data;
  if (!res.ok || !t.access_token) {
    throw new Error('Login failed. Check your username and password.');
  }
  saveTokens({ access_token: t.access_token, refresh_token: t.refresh_token });
}

export async function api(path, options = {}) {
  let { res, data } = await send(path, { ...options, token: getTokens()?.access_token });

  if (res.status === 401 && (await refresh())) {
    ({ res, data } = await send(path, { ...options, token: getTokens().access_token }));
  }
  if (res.status === 401) {
    clearTokens();
    window.dispatchEvent(new Event('auth:expired'));
  }
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
}