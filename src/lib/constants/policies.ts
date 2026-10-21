import { RESTAURANT_CONTACT, ROUTES } from "@/lib/constants";
import type { IPolicyPageContent } from "@/lib/types";

export const POLICY_PAGES = {
  privacy: {
    variant: "privacy",
    relatedPolicies: [
      { title: "Terms & Conditions", path: ROUTES.TERMS_CONDITIONS },
      { title: "Accessibility", path: ROUTES.ACCESSIBILITY_POLICY },
    ],
    title: "Privacy & Cookies",
    path: ROUTES.PRIVACY_COOKIES,
    seoDescription:
      "Read how Peploe’s handles personal information and cookies when you visit our website or contact our team.",
    eyebrow: "PRIVACY & COOKIES",
    heading: "Your privacy\nmatters.",
    description:
      "We are committed to protecting your personal information and being transparent about how we use it. This page explains how we collect, use and safeguard your data, and how we use cookies on our website.",
    image: {
      src: "/peploes-group-menu-booking.webp",
      alt: "A member of the Peploe’s team in the restaurant.",
    },
    sections: [
      {
        _key: "information-we-collect",
        heading: "Information we collect",
        body: [
          {
            text: "We may collect personal information that you provide to us, such as your name, email address, telephone number and any other details you share when making a reservation, enquiring about a group booking, purchasing a gift voucher, signing up to our newsletter or contacting us.",
          },
        ],
      },
      {
        _key: "how-we-use-your-information",
        heading: "How we use your information",
        body: [
          {
            text: "We use your information to process reservations and gift voucher purchases, respond to your enquiries, provide our services, and (with your consent) keep you updated about news, events and offers from Peploe’s.",
          },
        ],
      },
      {
        _key: "legal-basis-for-processing",
        heading: "Legal basis for processing",
        body: [
          {
            text: "We process your personal data on the basis of contractual necessity (e.g. fulfilling a reservation or voucher purchase), our legitimate interests (e.g. improving our services), and, where required, your consent (e.g. for marketing communications).",
          },
        ],
      },
      {
        _key: "sharing-your-information",
        heading: "Sharing your information",
        body: [
          {
            text: "We only share your information with trusted third parties who help us provide our services, such as our reservation, payment and email marketing providers. These partners are required to protect your data and only use it for the purposes we specify.",
          },
        ],
      },
      {
        _key: "cookies-and-similar-technologies",
        heading: "Cookies and similar technologies",
        body: [
          {
            text: "We use cookies and similar technologies to make our website work, understand how it is used and improve your experience. Some cookies are essential, while others help us analyse usage or personalise content. You can manage your cookie preferences at any time.",
          },
        ],
      },
      {
        _key: "managing-your-preferences",
        heading: "Managing your preferences",
        body: [
          {
            text: "You can update your cookie preferences through our cookie settings. You can also opt out of marketing communications at any time by following the unsubscribe link in our emails.",
          },
        ],
      },
      {
        _key: "data-security",
        heading: "Data security",
        body: [
          {
            text: "We take appropriate technical and organisational measures to protect your personal information and prevent unauthorised access, loss or misuse.",
          },
        ],
      },
      {
        _key: "how-long-we-keep-your-data",
        heading: "How long we keep your data",
        body: [
          {
            text: "We keep your personal information only for as long as necessary for the purposes set out in this policy or as required by law.",
          },
        ],
      },
      {
        _key: "your-rights",
        heading: "Your rights",
        body: [
          {
            text: "You have rights in relation to your personal data, including the right to access, correct or delete your information, and to object to or restrict certain processing. To exercise your rights, please contact us using the details below.",
          },
        ],
      },
      {
        _key: "third-party-services",
        heading: "Third-party services",
        body: [
          {
            text: "Our website and services may include links to third-party websites and providers. We are not responsible for their privacy practices and encourage you to review their policies.",
          },
        ],
      },
      {
        _key: "contact-us",
        heading: "Contact us",
        body: [
          {
            text: "If you have any questions about this policy or how your information is used, please contact us at ",
          },
          {
            text: RESTAURANT_CONTACT.email,
            href: `mailto:${RESTAURANT_CONTACT.email}`,
          },
          {
            text: " or call +353 1 676 3144.",
          },
        ],
      },
    ],
  },
  accessibility: {
    variant: "accessibility",
    relatedPolicies: [
      { title: "Privacy & Cookies", path: ROUTES.PRIVACY_COOKIES },
      { title: "Terms & Conditions", path: ROUTES.TERMS_CONDITIONS },
    ],
    title: "Accessibility",
    path: ROUTES.ACCESSIBILITY_POLICY,
    seoDescription:
      "Read Peploe’s accessibility policy and find out how to contact our team about access to our website and restaurant.",
    eyebrow: "ACCESSIBILITY",
    heading: "A warm welcome\nfor everyone.",
    description:
      "At Peploe’s, we want all our guests to feel comfortable, valued and able to enjoy our restaurant. We are committed to making our website and our restaurant as accessible and inclusive as possible.",
    image: {
      src: "/peploes-entrance-backdrop.png",
      alt: "Guests dining in Peploe’s, reflected in a mirror.",
    },
    sections: [
      {
        _key: "our-commitment",
        heading: "Our commitment",
        body: [
          {
            text: "We are committed to providing an inclusive experience for all our guests, both online and in our restaurant. We continually review our website and facilities to identify and remove barriers where possible.",
          },
        ],
      },
      {
        _key: "our-website",
        heading: "Our website",
        body: [
          {
            text: "We aim to ensure our website is accessible and easy to use for as many people as possible. We follow recognised accessibility guidelines and strive to maintain good colour contrast, clear navigation and readable text. If you experience any difficulties using our website, please let us know and we will do our best to help.",
          },
        ],
      },
      {
        _key: "visiting-the-restaurant",
        heading: "Visiting the restaurant",
        body: [
          {
            text: "Our team are happy to assist with any specific access requirements. If you have mobility, visual, hearing or other access needs, please let us know in advance when making a reservation so we can do our best to accommodate you.",
          },
        ],
      },
      {
        _key: "assistance-animals",
        heading: "Assistance animals",
        body: [
          {
            text: "Assistance dogs are very welcome at Peploe’s.",
          },
        ],
      },
      {
        _key: "alternative-formats",
        heading: "Alternative formats",
        body: [
          {
            text: "If you need information from our website or menus in an alternative format (e.g. larger text), please contact our team and we will be happy to help.",
          },
        ],
      },
      {
        _key: "feedback",
        heading: "Feedback",
        body: [
          {
            text: "We welcome your feedback on how we can continue to improve accessibility at Peploe’s. If you have any suggestions, or if you encounter any problems using our website or visiting the restaurant, please get in touch.",
          },
        ],
      },
    ],
  },
  terms: {
    variant: "terms",
    relatedPolicies: [
      {
        title: "Booking & Cancellation Terms",
        path: ROUTES.BOOKING_CANCELLATION_TERMS,
      },
      { title: "Privacy & Cookies", path: ROUTES.PRIVACY_COOKIES },
    ],
    title: "Terms & Conditions",
    path: ROUTES.TERMS_CONDITIONS,
    seoDescription:
      "Read the terms and conditions for using Peploe’s website and services.",
    eyebrow: "TERMS",
    heading: "Our terms\nand conditions.",
    description:
      "These terms set out the conditions for using our website and services, including information about gift vouchers, payments and third-party services.",
    image: {
      src: "/peploes-entrance-mobile.jpg",
      alt: "The ivy-covered entrance to Peploe’s on St Stephen’s Green.",
    },
    sections: [
      {
        _key: "website-use",
        heading: "Website use",
        body: [
          {
            text: "This website is operated by Peploe’s of St Stephen’s Green. By using this website, you agree to these terms and conditions. The content on this website is provided for general information and may be changed at any time without notice.",
          },
        ],
      },
      {
        _key: "gift-vouchers",
        heading: "Gift vouchers",
        body: [
          {
            text: "Peploe’s gift vouchers are a wonderful way to share the Peploe’s experience. The following terms apply to the purchase and use of our gift vouchers:",
          },
        ],
        items: [
          "Vouchers are valid from the date of purchase and have no expiry date.",
          "Vouchers can be used towards food and beverages at Peploe’s.",
          "We recommend making a reservation in advance and quoting your voucher number at the time of booking.",
          "Please present your voucher (printed or digital) on arrival.",
          "Vouchers are non-refundable and cannot be exchanged for cash.",
          "Vouchers may be gifted to friends, family or colleagues and are non-transferable for resale.",
          "Each voucher has a unique code. Please keep your voucher details private. Peploe’s cannot be held responsible for lost, stolen or unauthorised use of a voucher.",
          "Package vouchers, where applicable, can only be redeemed once.",
        ],
      },
      {
        _key: "payments-third-party-services",
        heading: "Payments & third-party services",
        body: [
          {
            text: "Payments for bookings and gift vouchers are processed securely through third-party, PCI-compliant payment gateways. We do not store your full card details. By making a booking or purchasing a voucher, you agree to the terms and conditions of the relevant payment provider.",
          },
        ],
      },
      {
        _key: "intellectual-property",
        heading: "Intellectual property",
        body: [
          {
            text: "All content on this website, including text, images, graphics and the Peploe’s name and logo, is the property of Peploe’s or its content suppliers and is protected by applicable copyright and trademark laws. You may not use, reproduce or distribute any content without our prior written consent.",
          },
        ],
      },
      {
        _key: "liability-disclaimers",
        heading: "Liability & disclaimers",
        body: [
          {
            text: "While we make every effort to ensure the information on this website is accurate and up to date, we do not accept any liability for errors, omissions or any loss arising from the use of this website.",
          },
        ],
      },
      {
        _key: "external-links",
        heading: "External links",
        body: [
          {
            text: "This website may contain links to third-party websites. We are not responsible for the content or practices of these websites.",
          },
        ],
      },
      {
        _key: "changes-to-these-terms",
        heading: "Changes to these terms",
        body: [
          {
            text: "We may update these terms and conditions from time to time. Any changes will be posted on this page and will apply from the date of publication.",
          },
        ],
      },
    ],
  },
  booking: {
    variant: "booking",
    relatedPolicies: [
      { title: "Terms & Conditions", path: ROUTES.TERMS_CONDITIONS },
      { title: "Privacy & Cookies", path: ROUTES.PRIVACY_COOKIES },
    ],
    title: "Booking & Cancellation Terms",
    path: ROUTES.BOOKING_CANCELLATION_TERMS,
    seoDescription:
      "Read Peploe’s booking and cancellation terms for restaurant reservations, private dining and events.",
    eyebrow: "BOOKING & CANCELLATION TERMS",
    heading: "Before you book.",
    description:
      "These terms apply to all reservations at Peploe’s, St Stephen’s Green, and help us provide the best possible experience for all our guests.",
    image: {
      src: "/images/policies/booking-cancellation.webp",
      alt: "Tables set with white linen and red flowers at Peploe’s.",
    },
    sections: [
      {
        _key: "card-guarantee",
        heading: "Card guarantee",
        body: [
          {
            text: "A valid debit or credit card is required for all online reservations, and for parties of 5 or more when booked directly with our team. Card details are securely stored via a PCI-compliant payment gateway.",
          },
        ],
      },
      {
        _key: "cancellations",
        heading: "Cancellations",
        body: [
          {
            text: "We kindly ask for at least 48 hours’ notice for cancellations. Late cancellations or no-shows may be charged the full menu price per person.",
          },
        ],
      },
      {
        _key: "party-size-changes",
        heading: "Party-size changes",
        body: [
          {
            text: "Reductions in party size require at least 24 hours’ notice. Otherwise, the full menu price per person may be charged for the reduced places.",
          },
        ],
      },
      {
        _key: "late-arrival",
        heading: "Late arrival",
        body: [
          {
            text: "Peploe’s allows a 20-minute grace period. After that, the reservation may be cancelled and the full menu price per person may be charged.",
          },
        ],
      },
      {
        _key: "how-to-cancel-or-amend",
        heading: "How to cancel or amend",
        body: [
          {
            text: "Cancellations or amendments should be made by emailing ",
          },
          {
            text: `${RESTAURANT_CONTACT.email}.`,
            href: `mailto:${RESTAURANT_CONTACT.email}`,
          },
          {
            text: " Please include your booking reference in your email.",
          },
        ],
      },
      {
        _key: "larger-groups",
        heading: "Larger groups",
        body: [
          {
            text: "Parties of 7 or more must be booked by telephone or email. Please contact our team to discuss your requirements.",
          },
        ],
      },
    ],
  },
} as const satisfies Record<IPolicyPageContent["variant"], IPolicyPageContent>;

export const POLICY_CONTENTS_LABEL = "On this page";

export const POLICY_HELP = {
  eyebrow: "NEED HELP WITH A RESERVATION?",
  heading: "We’re here to help.",
  description:
    "If you have any questions or need assistance with a booking, please contact our team.",
  phone: "+35316763144",
  phoneLabel: "+353 1 676 3144",
  email: RESTAURANT_CONTACT.email,
} as const;
