export function storageGet(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function storageRemove(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
