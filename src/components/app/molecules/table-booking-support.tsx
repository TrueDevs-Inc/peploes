import { Mail, Phone } from "lucide-react";
import { TrackedAnchor } from "@/components/app/atoms/tracked-link";
import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { GA4Event } from "@/lib/enums";
import type { ITableBookingSupportProps } from "@/lib/types";
import { cn } from "@/lib/utils";
export function TableBookingSupport({
  confirmation = false,
}: ITableBookingSupportProps) {
  const support = confirmation
    ? TABLE_BOOKING_CONTENT.confirmationSupport
    : TABLE_BOOKING_CONTENT.support;
  return (
    <div className={styles.support}>
      <div className={styles.supportInformation}>
        <span className={styles.contactEmblem} aria-hidden="true">
          <Phone className={styles.contactEmblemIcon} />
        </span>
        <div className={styles.supportCopy}>
          <h2 className={styles.supportHeading}>{support.heading}</h2>
          <p className={styles.supportDescription}>{support.description}</p>
        </div>
      </div>
      <div className={styles.contactActions}>
        <Button
          asChild
          variant="brand-contact"
          className={cn(styles.contactAction, styles.emailAction)}
        >
          <TrackedAnchor
            href={`mailto:${RESTAURANT_CONTACT.email}`}
            interaction={{
              event: GA4Event.ContactClick,
              placement: "table_booking_support",
              destination: "email",
            }}
          >
            <Mail aria-hidden="true" className={styles.contactActionIcon} />
            <span className={styles.desktopEmail}>
              {TABLE_BOOKING_CONTENT.support.emailLabel}
            </span>
            <span className={styles.mobileEmail}>
              {RESTAURANT_CONTACT.email}
            </span>
          </TrackedAnchor>
        </Button>
        <Button
          asChild
          variant="brand-contact"
          className={cn(styles.contactAction, styles.phoneAction)}
        >
          <TrackedAnchor
            href={`tel:${RESTAURANT_CONTACT.phone}`}
            interaction={{
              event: GA4Event.ContactClick,
              placement: "table_booking_support",
              destination: "phone",
            }}
          >
            <Phone aria-hidden="true" className={styles.contactActionIcon} />
            {RESTAURANT_CONTACT.phoneLabel}
          </TrackedAnchor>
        </Button>
      </div>
    </div>
  );
}
