import styles from "@/components/app/compounds/private-dining.module.css";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type { IPrivateDiningLayoutProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PrivateDiningLayout({
  children,
}: IPrivateDiningLayoutProps) {
  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
      {children}
    </main>
  );
}
