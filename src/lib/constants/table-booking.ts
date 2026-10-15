export const TABLE_BOOKING_CONTENT = {
  label: "Table reservations",
  progressLabel: "Booking progress",
  previewMessage:
    "Design preview — sample times only. No reservation will be made.",
  previewConfirmation:
    "No table has been reserved and no confirmation email has been sent.",
  steps: [
    { number: "01", mobileNumber: "1", label: "Find a table" },
    { number: "02", mobileNumber: "2", label: "Choose a time" },
    { number: "03", mobileNumber: "3", label: "Your details" },
    { number: "04", mobileNumber: "4", label: "Confirmation" },
  ],
  date: { label: "Date", initialValue: "2025-04-24" },
  partySize: {
    label: "Party size",
    initialValue: "2",
    options: [1, 2, 3, 4, 5, 6, 7],
  },
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  action: "Find a Table",
  times: [
    "5:30 pm",
    "6:00 pm",
    "6:30 pm",
    "7:00 pm",
    "7:30 pm",
    "8:00 pm",
    "8:30 pm",
    "9:00 pm",
  ],
  moreTimes: [
    "12:00 pm",
    "12:30 pm",
    "1:00 pm",
    "1:30 pm",
    "2:00 pm",
    "3:00 pm",
  ],
  returnTime: {
    start: "7:00 pm",
    end: "9:00pm",
    label: "I understand the table is required back by 9:00pm",
  },
  details: {
    heading: "Your details",
    description: "Please provide a few details to confirm your reservation.",
    nameError: "Please enter your name.",
    emailError: "Please enter a valid email address.",
    phoneError: "Please enter a valid telephone number.",
    termsError: "Please acknowledge the booking terms for this preview.",
    action: "Confirm Reservation",
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
