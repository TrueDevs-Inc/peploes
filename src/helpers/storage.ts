function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getLocalStorage<T>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) return null;
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error("Error getting item from localStorage", error);
    return null;
  }
}

export function setLocalStorage(key: string, value: unknown): void {
  if (!isBrowser()) return;

  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error("Error setting item in localStorage", error);
  }
}

export function removeLocalStorage(key: string): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing item from localStorage", error);
  }
}

export function getSessionStorage<T>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const serializedValue = sessionStorage.getItem(key);
    if (serializedValue === null) return null;
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error("Error getting item from sessionStorage", error);
    return null;
  }
}

export function setSessionStorage(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;

  try {
    const serializedValue = JSON.stringify(value);
    sessionStorage.setItem(key, serializedValue);
    return sessionStorage.getItem(key) === serializedValue;
  } catch (error) {
    console.error("Error setting item in sessionStorage", error);
    return false;
  }
}

export function removeSessionStorage(key: string): void {
  if (!isBrowser()) return;

  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing item from sessionStorage", error);
  }
}
