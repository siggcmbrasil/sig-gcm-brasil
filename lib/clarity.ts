declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export function clarityEvent(event: string) {
  if (typeof window === "undefined") return;

  if (typeof window.clarity === "function") {
    window.clarity("event", event);
  }
}

export function clarityTag(key: string, value: string) {
  if (typeof window === "undefined") return;

  if (typeof window.clarity === "function") {
    window.clarity("set", key, value);
  }
}