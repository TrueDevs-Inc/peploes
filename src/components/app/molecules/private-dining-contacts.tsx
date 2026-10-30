import { Mail, Phone } from "lucide-react";
import { TrackedAnchor } from "@/components/app/atoms/tracked-link";
import styles from "@/components/app/compounds/private-dining.module.css";
import { Button } from "@/components/ui/button";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { PRIVATE_DINING_FORM } from "@/lib/constants/private-dining";
import { GA4Event } from "@/lib/enums";

export function PrivateDiningContacts() {
  return (
    <div className={styles.contacts}>
      <Button asChild variant="brand-contact">
        <TrackedAnchor
          href={`tel:${RESTAURANT_CONTACT.phone}`}
          interaction={{
            event: GA4Event.ContactClick,
            placement: "private_dining",
            destination: "phone",
          }}
        >
          <Phone aria-hidden="true" className="size-4" />
          {RESTAURANT_CONTACT.phoneLabel}
        </TrackedAnchor>
      </Button>
      <Button asChild variant="brand-contact">
        <TrackedAnchor
          href={`mailto:${RESTAURANT_CONTACT.email}`}
          interaction={{
            event: GA4Event.ContactClick,
            placement: "private_dining",
            destination: "email",
          }}
        >
          <Mail aria-hidden="true" className="size-4" />
          {PRIVATE_DINING_FORM.emailAction}
        </TrackedAnchor>
      </Button>
    </div>
  );
}
