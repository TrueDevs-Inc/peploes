import type { PropsWithChildren } from "react";

import styles from "@/components/app/molecules/table-booking-processing.module.css";

export function TableBookingProcessing({ children }: PropsWithChildren) {
  return (
    <div role="status" className={styles.processing}>
      <p>{children}</p>
      <span aria-hidden="true" className={styles.circle} />
    </div>
  );
}
