import styles from "@/components/app/molecules/table-booking-skeleton.module.css";

export function TableBookingCalendarSkeleton() {
  return (
    <span
      aria-hidden="true"
      data-booking-skeleton="calendar"
      className={styles.calendar}
    />
  );
}

export function TableBookingFormSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-booking-skeleton="form"
      className={styles.form}
    >
      <div className={styles.field}>
        <span className={styles.label} />
        <span className={styles.control} />
      </div>
      <div className={styles.field}>
        <span className={styles.label} />
        <span className={styles.control} />
      </div>
      <span className={styles.action} />
    </div>
  );
}

export function TableBookingTimesSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-booking-skeleton="times"
      className={styles.times}
    >
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function TableBookingStatusSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-booking-skeleton="status"
      className={styles.status}
    >
      <span />
      <span />
      <span />
    </div>
  );
}

export function TableBookingPaymentSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-booking-skeleton="payment"
      className={styles.payment}
    >
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
