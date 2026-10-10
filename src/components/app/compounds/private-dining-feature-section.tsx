import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningFeatures } from "@/components/app/molecules/private-dining-features";
import { PrivateDiningHeading } from "@/components/app/molecules/private-dining-heading";
import type { IPrivateDiningFeatureSectionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningFeatureSection({
  content,
  className,
  featuresClassName,
}: IPrivateDiningFeatureSectionProps) {
  return (
    <section className={cn(styles.paleSection, className)}>
      <div className="site-container">
        <PrivateDiningHeading {...content} />
        <PrivateDiningFeatures
          items={content.items}
          className={featuresClassName}
        />
      </div>
    </section>
  );
}
