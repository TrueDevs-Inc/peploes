import { RESTAURANT_CONTACT } from "@/lib/constants";
import type { IHumanHospitalityContent } from "@/lib/types";

export const HUMAN_HOSPITALITY_CONTENT = {
  eyebrow: "Hospitality",
  heading: "Would you prefer to speak to us?",
  description:
    "If the table, date or time you’re looking for isn’t showing online, speak to the team. We’ll always do our best to help.",
  phoneAction: {
    href: `tel:${RESTAURANT_CONTACT.phone}`,
    label: RESTAURANT_CONTACT.phoneLabel,
  },
  emailAction: {
    href: `mailto:${RESTAURANT_CONTACT.email}`,
    label: "Email Reception",
  },
  image: {
    src: "/peploes-reception.png",
    alt: "A glowing lamp and vintage telephone on the Peploe’s reception desk.",
  },
} as const satisfies IHumanHospitalityContent;
