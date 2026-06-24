import axios from "axios";

const API_BASE_URL = "http://localhost:5001";
const ACCESS_TOKEN_KEY = "accessToken";

const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

type AuthResponse = { accessToken: string };

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}
export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
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
  const token = getAccessToken();
  if (!token) return null;
  return decodeJwtPayload(token)?.userId ?? null;
}

export async function signUp(name: string, email: string, password: string) {
  const { data } = await authApi.post<AuthResponse>("/register", {
    name,
    email,
    password,
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data } = await authApi.post<AuthResponse>("/login", {
    email,
    password,
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function refreshSession() {
  const { data } = await authApi.post<AuthResponse>("/refresh");
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function signOut() {
  await authApi.post("/logout");
  clearAccessToken();
}
