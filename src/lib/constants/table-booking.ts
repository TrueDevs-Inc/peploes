import { RESTAURANT_CONTACT } from "@/lib/constants";

export const TABLE_BOOKING_CONTENT = {
  label: "Table reservations",
  progressLabel: "Booking progress",
  loadingMessage: "Loading available dates…",
  checkingDates: "Checking which days are full…",
  fullDate: (guests: string, date: string) =>
    `No tables for ${guests} on ${date}. Please choose another day.`,
  holding: "Holding Your Table…",
  heldFor: (time: string) => `Table held for ${time}`,
  chooseAgain: "Choose a Time Again",
  startAgain: "Start Again",
  changeBooking: {
    heading: "Change your booking?",
    text: (time: string, date: string) =>
      `We'll release your table for ${time} on ${date} so you can choose another time. You haven't been charged.`,
    keep: "Keep My Table",
    release: "Release and Change",
    releasing: "Releasing…",
    checking: "Checking whether your table was released…",
    checkingAction: "Checking…",
    checkAgain: "Check Again",
    stillHeld:
      "We couldn't release your table, so it's still held for you. You can keep it or try again.",
    unknown: (reference: string) =>
      `We couldn't confirm whether booking ${reference} was released. Please call us on ${RESTAURANT_CONTACT.phoneLabel} before booking or paying again.`,
  },
  steps: [
    { number: "01", mobileNumber: "1", label: "Find a table" },
    { number: "02", mobileNumber: "2", label: "Choose a time" },
    { number: "03", mobileNumber: "3", label: "Your details" },
    { number: "04", mobileNumber: "4", label: "Confirmation" },
  ],
  date: { label: "Date" },
  partySize: { label: "Party size" },
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  action: "Find a Table",
  timesLabel: "Available times",
  findingTimes: "Finding tables…",
  connectionLost: `We couldn't reach our booking system. Check your connection and try again, or call us on ${RESTAURANT_CONTACT.phoneLabel}.`,
  tableUntil: (time: string) => `Table until ${time}`,
  returnTime: {
    heading: "This table has a return time",
    accept: (time: string) =>
      `I understand the table is required back by ${time}`,
  },
  noTimes: {
    closed: (date: string) =>
      `We're closed on ${date}. Please choose another day.`,
    noneOnline: (guests: string, date: string) =>
      `There are no tables for ${guests} online on ${date}. Please choose another day, or call us on ${RESTAURANT_CONTACT.phoneLabel}.`,
    allPassed: (date: string) =>
      `Online booking for ${date} has closed. Please choose another day, or call us on ${RESTAURANT_CONTACT.phoneLabel}.`,
  },
  details: {
    heading: "Your details",
    description: "Please provide a few details to confirm your reservation.",
    nameError: "Please enter your name.",
    emailError: "Please enter a valid email address.",
    phoneError: "Please enter a valid telephone number.",
    termsError: "Please accept the booking terms.",
    action: "Confirm Reservation",
    sending: "Confirming…",
    countryCode: "Country code",
    checking: "Checking whether your booking went through…",
    resend:
      "We couldn't tell whether your details reached us. Your table is still held, so please press Confirm Reservation again.",
    stillConfirming: (reference: string) =>
      `Hang tight! We're still confirming booking ${reference}. If you hear nothing in a few minutes, please call us on ${RESTAURANT_CONTACT.phoneLabel} and quote this reference.`,
  },
  countryCodes: [
    { code: "353", label: "IE +353" },
    { code: "44", label: "UK +44" },
    { code: "1", label: "US/CA +1" },
    { code: "33", label: "FR +33" },
    { code: "49", label: "DE +49" },
    { code: "34", label: "ES +34" },
    { code: "39", label: "IT +39" },
    { code: "31", label: "NL +31" },
    { code: "32", label: "BE +32" },
    { code: "351", label: "PT +351" },
    { code: "48", label: "PL +48" },
    { code: "46", label: "SE +46" },
    { code: "45", label: "DK +45" },
    { code: "47", label: "NO +47" },
    { code: "41", label: "CH +41" },
    { code: "43", label: "AT +43" },
    { code: "61", label: "AU +61" },
  ],
  payment: {
    depositHeading: "Secure your table",
    deposit: (amount: string) =>
      `A ${amount} deposit is needed to reserve this table.`,
    pay: (amount: string) => `Pay ${amount} and Reserve`,
    cardHeading: "Secure your table",
    card: (amount: string) =>
      `You won't be charged now. If you don't arrive, a charge of ${amount} may apply.`,
    saveCard: "Save Card and Reserve",
    loading: "Loading secure payment…",
    paying: "Processing Payment…",
    loadFailed: `We couldn't load the secure payment form. Check your connection and try again, or call us on ${RESTAURANT_CONTACT.phoneLabel}.`,
    tryAgain: "Try Again",
    failed:
      "Your card wasn't accepted. Please check the details or try another card.",
    bankFailed:
      "Your bank didn't approve the payment. Please try again or use another card.",
    checking: "Confirming your booking…",
    cantCheck: (reference: string) =>
      `We can't check booking ${reference} from this page. If you finished it in another tab, your confirmation will follow; otherwise call us on ${RESTAURANT_CONTACT.phoneLabel} or start again.`,
    stillConfirming: (reference: string) =>
      `Hang tight! We're still confirming booking ${reference}. If your card was charged, your confirmation will follow shortly. If you hear nothing in a few minutes, please call us on ${RESTAURANT_CONTACT.phoneLabel}.`,
    notConfirmed: (reference: string) =>
      `We couldn't confirm booking ${reference}. If your card was charged, please call us on ${RESTAURANT_CONTACT.phoneLabel} and quote this reference.`,
  },
  stripeAppearance: {
    theme: "stripe",
    variables: {
      colorPrimary: "#790e1d",
      colorBackground: "#fcfaf7",
      colorText: "#221a17",
      colorDanger: "#790e1d",
      fontFamily: '"DM Sans", system-ui, sans-serif',
      fontSizeBase: "16px",
      borderRadius: "4px",
    },
    rules: {
      ".Input": { border: "1px solid #ddd9d1", boxShadow: "none" },
      ".Input:focus": { border: "1px solid #790e1d", boxShadow: "none" },
      ".Label": { color: "#111110", fontWeight: "500" },
    },
  },
  confirmation: {
    heading: "Your table is booked.",
    referenceLabel: "Booking reference",
    keepReference:
      "Keep this reference in case you need to change or cancel your booking.",
  },
  support: {
    heading: "Can’t find your preferred date?",
    description:
      "Some dates, especially busy periods and special occasions, are managed directly by our team. Please call or email us and we’ll be happy to\nassist.",
    emailLabel: "Email Reception",
  },
  confirmationSupport: {
    heading: "Need to make a change?",
    description:
      "If you need to modify or cancel your reservation, please contact our team.",
  },
} as const;
