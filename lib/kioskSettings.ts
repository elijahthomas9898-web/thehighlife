/**
 * Per-device kiosk settings, edited at /kiosk/settings.
 *
 * Stored in localStorage rather than anywhere central, deliberately: each tablet
 * on the floor is its own machine with its own printer and its own spot in the
 * room. The one by the door might want a longer idle timeout than the one at the
 * counter. There's no server to sync to and no login on these devices.
 *
 * Every read is defensive. A kiosk that throws on boot because a stored value went
 * bad is a tablet showing a blank screen to customers, so anything unreadable
 * falls back to defaults rather than propagating.
 */
export type KioskSettings = {
  /** Minutes of inactivity before JSCart resets the cart for the next customer. */
  resetMinutes: number;
  /** Seconds untouched before the attract screen takes over. */
  attractIdleSeconds: number;
  /** Seconds each deal is shown on the attract screen. */
  attractRotateSeconds: number;
  /** Show the idle attract screen at all. */
  attractEnabled: boolean;
  /** Show the slide-up deals panel. */
  dealsPanelEnabled: boolean;
  /**
   * Hand a pickup ticket to RawBT when a kiosk order is placed.
   *
   * OFF by default and deliberately a switch: Proteus Server Direct Printing may
   * also be printing these, and two systems printing means every customer gets two
   * tickets. Turn this on only while SDP is not doing the job.
   */
  autoPrintTickets: boolean;
};

export const KIOSK_DEFAULTS: KioskSettings = {
  resetMinutes: 3,
  attractIdleSeconds: 45,
  attractRotateSeconds: 6,
  attractEnabled: true,
  dealsPanelEnabled: true,
  autoPrintTickets: false,
};

export const KIOSK_SETTINGS_KEY = "hl_kiosk_settings";

/** Fired on `window` after a save, so an open kiosk tab picks up changes. */
export const KIOSK_SETTINGS_EVENT = "hl-kiosk-settings";

/** Sane bounds — a 0-minute reset or a 1-second attract would make the kiosk unusable. */
const BOUNDS: Record<string, [number, number]> = {
  resetMinutes: [1, 30],
  attractIdleSeconds: [10, 600],
  attractRotateSeconds: [2, 60],
};

function clampNumber(key: string, value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const [min, max] = BOUNDS[key] ?? [-Infinity, Infinity];
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function loadKioskSettings(): KioskSettings {
  if (typeof window === "undefined") return { ...KIOSK_DEFAULTS };
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KIOSK_SETTINGS_KEY);
  } catch {
    return { ...KIOSK_DEFAULTS }; // private mode / storage blocked
  }
  if (!raw) return { ...KIOSK_DEFAULTS };

  try {
    const parsed = JSON.parse(raw) as Partial<KioskSettings>;
    return {
      resetMinutes: clampNumber("resetMinutes", parsed.resetMinutes, KIOSK_DEFAULTS.resetMinutes),
      attractIdleSeconds: clampNumber(
        "attractIdleSeconds",
        parsed.attractIdleSeconds,
        KIOSK_DEFAULTS.attractIdleSeconds,
      ),
      attractRotateSeconds: clampNumber(
        "attractRotateSeconds",
        parsed.attractRotateSeconds,
        KIOSK_DEFAULTS.attractRotateSeconds,
      ),
      attractEnabled:
        typeof parsed.attractEnabled === "boolean"
          ? parsed.attractEnabled
          : KIOSK_DEFAULTS.attractEnabled,
      dealsPanelEnabled:
        typeof parsed.dealsPanelEnabled === "boolean"
          ? parsed.dealsPanelEnabled
          : KIOSK_DEFAULTS.dealsPanelEnabled,
      autoPrintTickets:
        typeof parsed.autoPrintTickets === "boolean"
          ? parsed.autoPrintTickets
          : KIOSK_DEFAULTS.autoPrintTickets,
    };
  } catch {
    return { ...KIOSK_DEFAULTS };
  }
}

export function saveKioskSettings(next: KioskSettings): boolean {
  try {
    localStorage.setItem(KIOSK_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(KIOSK_SETTINGS_EVENT, { detail: next }));
    return true;
  } catch {
    return false;
  }
}

export function clearKioskSettings(): void {
  try {
    localStorage.removeItem(KIOSK_SETTINGS_KEY);
    window.dispatchEvent(new CustomEvent(KIOSK_SETTINGS_EVENT, { detail: KIOSK_DEFAULTS }));
  } catch {
    /* nothing to clear */
  }
}
