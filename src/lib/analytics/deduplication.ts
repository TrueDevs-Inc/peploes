import { ANALYTICS, ANALYTICS_ATTEMPT_ID_PATTERN } from "@/lib/constants";

const CONFIRMATION_PREFIX = "booking-confirmed:";

function isConfirmation(key: string): boolean {
  return (
    key.startsWith(CONFIRMATION_PREFIX) &&
    ANALYTICS_ATTEMPT_ID_PATTERN.test(key.slice(CONFIRMATION_PREFIX.length))
  );
}

export function createEventHistory(storageKey: string) {
  const dispatched = new Set<string>();

  function stored(): string[] {
    try {
      const value: unknown = JSON.parse(
        window.localStorage.getItem(storageKey) ?? "[]",
      );
      return Array.isArray(value)
        ? value
            .filter((key) => typeof key === "string" && isConfirmation(key))
            .slice(-ANALYTICS.MAX_HISTORY_SIZE)
        : [];
    } catch {
      return [];
    }
  }

  function isDuplicate(key: string) {
    return (
      dispatched.has(key) || (isConfirmation(key) && stored().includes(key))
    );
  }

  function record(key: string) {
    dispatched.add(key);
    if (dispatched.size > ANALYTICS.MAX_HISTORY_SIZE) {
      const oldest = dispatched.values().next().value;
      if (oldest !== undefined) dispatched.delete(oldest);
    }
    if (!isConfirmation(key)) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(
          [...new Set([...stored(), key])].slice(-ANALYTICS.MAX_HISTORY_SIZE),
        ),
      );
    } catch {
      return;
    }
  }

  return {
    dispatch(key: string | undefined, deliver: () => boolean): void {
      const send = () => {
        if (key && isDuplicate(key)) return;
        try {
          if (deliver() && key) record(key);
        } catch {
          return;
        }
      };
      try {
        if (
          key &&
          isConfirmation(key) &&
          typeof navigator !== "undefined" &&
          navigator.locks
        ) {
          void navigator.locks.request(storageKey, send).catch(send);
        } else send();
      } catch {
        send();
      }
    },
    clear: (): void => dispatched.clear(),
  };
}
