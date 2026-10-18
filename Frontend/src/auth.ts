import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ACCESS_TOKEN_KEY = "accessToken";
const DEMO_MODE_KEY = "readarchive-demo-mode";
const DEMO_USER_ID_KEY = "readarchive-demo-user-id";
export const DEMO_BLOCKLIST_STORAGE_KEY = "readarchive-demo-blocklist";

const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

type AuthResponse = { accessToken: string };
type DemoSessionResponse = { userId: number };

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}
export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isDemoMode(): boolean {
  return sessionStorage.getItem(DEMO_MODE_KEY) === "true";
}

export function getDemoUserId(): number | null {
  const value = Number(sessionStorage.getItem(DEMO_USER_ID_KEY));
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function clearDemoSessionState(): void {
  sessionStorage.removeItem(DEMO_MODE_KEY);
  sessionStorage.removeItem(DEMO_USER_ID_KEY);
  localStorage.removeItem(DEMO_BLOCKLIST_STORAGE_KEY);
}

function decodeJwtPayload(token: string): { userId: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload?.userId === "number" ? payload : null;
  } catch {
    return null;
  }
}

export function getAuthUserId(): number | null {
  if (isDemoMode()) {
    return getDemoUserId();
  }

  const token = getAccessToken();
  if (!token) return null;
  return decodeJwtPayload(token)?.userId ?? null;
}

export async function startDemoSession(): Promise<number> {
  const { data } = await authApi.post<DemoSessionResponse>("/demo/session");

  clearDemoSessionState();
  clearAccessToken();
  sessionStorage.setItem(DEMO_MODE_KEY, "true");
  sessionStorage.setItem(DEMO_USER_ID_KEY, String(data.userId));

  return data.userId;
}

export async function validateDemoSession(): Promise<void> {
  const userId = getDemoUserId();
  if (!userId) {
    throw new Error("Demo session is missing a user ID");
  }

  await authApi.get(`/users/${userId}/sources`);
}

export async function signUp(name: string, email: string, password: string) {
  const { data } = await authApi.post<AuthResponse>("/register", {
    name,
    email,
    password,
  });
  setAccessToken(data.accessToken);
  clearDemoSessionState();
  return data;
}

export async function signIn(email: string, password: string) {
  const { data } = await authApi.post<AuthResponse>("/login", {
    email,
    password,
  });
  setAccessToken(data.accessToken);
  clearDemoSessionState();
  return data;
}

export async function refreshSession() {
  const { data } = await authApi.post<AuthResponse>("/refresh");
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function signOut() {
  if (isDemoMode()) {
    clearDemoSessionState();
    clearAccessToken();
    return;
  }

  await authApi.post("/logout");
  clearAccessToken();
}
