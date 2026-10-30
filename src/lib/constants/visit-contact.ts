export const VISIT_CONTACT_CONTENT = {
  title: "Visit & Contact",
  seoDescription:
    "Visit Peploe’s at 16 St Stephen’s Green, Dublin 2. Find opening hours, directions, dining times and contact details for our restaurant team.",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Peploe%27s%2C%2016%20St%20Stephen%27s%20Green%2C%20Dublin%202",
  directionsLabel: "Get Directions",
  bookingLabel: "Book a Table",
  hero: {
    eyebrow: "Visit Peploe’s",
    heading: "Step down\nfrom the city.",
    address: "16 St Stephen’s Green, Dublin 2",
    description:
      "In the heart of Dublin, overlooking St Stephen’s Green, Peploe’s offers a warmer world of food, wine and hospitality.",
    image: {
      src: "/peploes-visit-entrance.webp",
      alt: "Peploe’s entrance and terrace beneath its burgundy awning on St Stephen’s Green.",
    },
  },
  contact: {
    hoursHeading: "Opening Hours",
    addressHeading: "Address",
    heading: "Contact",
    address: "16 St Stephen’s Green\nDublin 2\nIreland",
  },
  location: {
    eyebrow: "Find us",
    heading: "Right on\nSt Stephen’s Green.",
    description:
      "Peploe’s is located on St Stephen’s Green, in Dublin’s city centre, with excellent transport links and easy access.",
    map: {
      src: "/peploes-visit-map.webp",
      alt: "Map showing Peploe’s on the north side of St Stephen’s Green in central Dublin.",
      label: "Interactive map showing Peploe’s",
      unavailable: "Interactive map unavailable. You can still get directions.",
      recenterLabel: "Recenter map on Peploe’s",
      markerLabel: "Peploe’s, 16 St Stephen’s Green",
    },
    transportHeading: "Getting here",
    transport: [
      {
        heading: "Luas",
        description: "St Stephen’s Green Luas stop is just a short walk away.",
        icon: "/peploes-events-bus.svg",
      },
      {
        heading: "DART",
        description: "Dublin Pearse Station is within walking distance.",
        icon: "/peploes-visit-luas.svg",
      },
      {
        heading: "Taxi",
        description:
          "A taxi rank is located near St Stephen’s Green and on nearby streets.",
        icon: "/peploes-events-taxi.svg",
      },
      {
        heading: "Parking",
        description:
          "Parking options are available nearby. Our team can advise on the closest options if needed.",
        icon: "/peploes-visit-parking.svg",
      },
    ],
  },
  closing: {
    eyebrow: "Peploe’s",
    heading: "The city fades.\nThe evening begins.",
    description:
      "From St Stephen’s Green into a warmer world of food, wine and hospitality.",
    image: { src: "/peploes-entrance-backdrop.png", alt: "" },
  },
} as const;

export const VISIT_MAP = {
  center: [-6.25817, 53.33949] as [number, number],
  zoom: 15,
  minZoom: 10,
  maxZoom: 19,
  loadTimeoutMs: 20_000,
  colors: {
    land: "#faf6ed",
    water: "#c3d7dc",
    park: "#dce3cc",
  },
} as const;
