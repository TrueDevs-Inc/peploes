const DAY_MS = 86_400_000;
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const FAKE_RESDIARY = {
  url: "https://resdiary.e2e.test",
  downUrl: "https://resdiary-down.e2e.test",
  downDelayMs: 2000,
  micrositeName: "PeploesE2E",
  minPartySize: 1,
  maxPartySize: 6,
  defaultPartySize: 4,
  daysAhead: 45,
  closedWeekday: "Monday",
  closedPeriod: { fromOffset: 8, toOffset: 10 },
  firstDaysFullPartySize: 2,
  failingPartySize: 5,
  slowPartySize: 6,
  slowDelayMs: 2000,
  holdMs: 300_000,
  slowHoldTime: "12:30",
  failingHoldTime: "20:00",
  failingStatusTime: "12:00",
  depositTime: "18:30",
  lostReplyEmail: "lost-reply@example.com",
} as const;

export const FAKE_TIMES = [
  { time: "12:00", label: "12:00 pm", leave: "13:30", required: false },
  { time: "12:30", label: "12:30 pm", leave: "14:00", required: false },
  { time: "18:00", label: "6:00 pm", leave: "20:00", required: false },
  { time: "18:30", label: "6:30 pm", leave: "20:30", required: false },
  { time: "19:00", label: "7:00 pm", leave: "21:00", required: true },
  { time: "20:00", label: "8:00 pm", leave: "22:00", required: false },
] as const;

export function dublinToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
  }).format(new Date());
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function weekdayName(date: string): string {
  return WEEKDAYS[new Date(Date.parse(date)).getUTCDay()] ?? "";
}

export function closedPeriod(today: string): { from: string; to: string } {
  return {
    from: addDays(today, FAKE_RESDIARY.closedPeriod.fromOffset),
    to: addDays(today, FAKE_RESDIARY.closedPeriod.toOffset),
  };
}

export function isOpen(date: string, today: string): boolean {
  const period = closedPeriod(today);
  return (
    date >= today &&
    date <= addDays(today, FAKE_RESDIARY.daysAhead) &&
    weekdayName(date) !== FAKE_RESDIARY.closedWeekday &&
    (date < period.from || date > period.to)
  );
}

export function openDates(today: string): string[] {
  return Array.from({ length: FAKE_RESDIARY.daysAhead + 1 }, (_, offset) =>
    addDays(today, offset),
  ).filter((date) => isOpen(date, today));
}

export function dayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${weekdayName(date)}, ${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export function monthLabel(date: string): string {
  const [year, month] = date.split("-").map(Number);
  return `${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export function shortDayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const name = MONTHS[(month ?? 1) - 1]?.slice(0, 3);
  return `${weekdayName(date).slice(0, 3)}, ${day} ${name} ${year}`;
}

export function fullDates(today: string, partySize: number): string[] {
  const open = openDates(today);
  if (partySize === FAKE_RESDIARY.firstDaysFullPartySize) {
    return [open[0], open[1]].filter((date) => date !== undefined);
  }
  if (partySize === FAKE_RESDIARY.slowPartySize) {
    return [open[1], open[3]].filter((date) => date !== undefined);
  }
  const later = open.find((date) => date >= addDays(today, 35));
  return [open[2], open[4], later].filter((date) => date !== undefined);
}

export function freeDates(today: string, partySize: number): string[] {
  const full = fullDates(today, partySize);
  return openDates(today).filter((date) => !full.includes(date));
}
