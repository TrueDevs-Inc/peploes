import { Mail, Phone } from "lucide-react";

import styles from "@/components/app/compounds/private-dining.module.css";
import { Button } from "@/components/ui/button";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { PRIVATE_DINING_FORM } from "@/lib/constants/private-dining";

export function PrivateDiningContacts() {
  return (
    <div className={styles.contacts}>
      <Button asChild variant="brand-contact">
        <a href={`tel:${RESTAURANT_CONTACT.phone}`}>
          <Phone aria-hidden="true" className="size-4" />
          {RESTAURANT_CONTACT.phoneLabel}
        </a>
      </Button>
      <Button asChild variant="brand-contact">
        <a href={`mailto:${RESTAURANT_CONTACT.email}`}>
          <Mail aria-hidden="true" className="size-4" />
          {PRIVATE_DINING_FORM.emailAction}
        </a>
      </Button>
    </div>
  );
}
