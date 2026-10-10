import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningContacts } from "@/components/app/molecules/private-dining-contacts";
import { PrivateDiningEnquiryFields } from "@/components/app/molecules/private-dining-enquiry-fields";
import { PrivateDiningHeading } from "@/components/app/molecules/private-dining-heading";
import { PRIVATE_DINING_FORM } from "@/lib/constants/private-dining";
import type { IPrivateDiningEnquiryProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningEnquiry({
  content,
  compact = false,
  className,
}: IPrivateDiningEnquiryProps) {
  return (
    <section
      id="enquire"
      className={cn(
        styles.enquiry,
        compact && styles.compactEnquiry,
        className,
      )}
    >
      <div className={cn("site-container", styles.enquiryContainer)}>
        <div className={styles.enquiryIntro}>
          <PrivateDiningHeading
            eyebrow={content.eyebrow}
            heading={content.heading}
            description={content.description}
          />
          {content.contacts && <PrivateDiningContacts />}
        </div>
        <div className={styles.enquiryForm}>
          {content.formEyebrow && (
            <PrivateDiningHeading
              eyebrow={content.formEyebrow}
              heading={PRIVATE_DINING_FORM.heading}
            />
          )}
          <PrivateDiningEnquiryFields content={content} />
        </div>
      </div>
    </section>
  );
}
