import { ANALYTICS } from "@/lib/constants";

/**
 * Keys name one occurrence (for example a navigation), so there is no time
 * window that could swallow a legitimate quick revisit. Each provider owns its
 * own history: one provider's success never suppresses another's event.
 */
export function createEventHistory() {
  const dispatched = new Set<string>();

  return {
    isDuplicate: (dedupeKey: string): boolean => dispatched.has(dedupeKey),
    /** Call only after the transport accepted the event. */
    record(dedupeKey: string): void {
      dispatched.add(dedupeKey);
      if (dispatched.size <= ANALYTICS.MAX_HISTORY_SIZE) return;
      const oldest = dispatched.values().next().value;
      if (oldest !== undefined) dispatched.delete(oldest);
    },
    clear: (): void => dispatched.clear(),
  };
}
