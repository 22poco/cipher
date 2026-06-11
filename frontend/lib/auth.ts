import type { AuthResponse, User } from "./api";

const tokenKey = "cipher_token";
const userKey = "cipher_user";
const sessionEvent = "cipher-session-change";


function announceSessionChange() {
  window.dispatchEvent(new Event(sessionEvent));
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem(tokenKey, auth.access_token);
  localStorage.setItem(userKey, JSON.stringify(auth.user));
  announceSessionChange();
}

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function getStoredUser(): User | null {
  const storedUser = localStorage.getItem(userKey);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  announceSessionChange();
}

export function subscribeToSessionChange(callback: () => void) {
  window.addEventListener(sessionEvent, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(sessionEvent, callback);
    window.removeEventListener("storage", callback);
  };
}
