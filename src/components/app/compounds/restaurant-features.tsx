import Image from "next/image";

import { RESTAURANT_FEATURES_CONTENT } from "@/lib/constants/restaurant-features";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function RestaurantFeatures() {
  return (
    <section
      aria-label={RESTAURANT_FEATURES_CONTENT.sectionLabel}
      className={cn(
        dmSans.className,
        "bg-warm-cream text-center text-ink shadow-[inset_0_1px_0_var(--soft-stone)]",
      )}
    >
      <ul className="site-container grid grid-cols-1 gap-8 pt-[38px] pb-11 sm:grid-cols-2 sm:gap-10 sm:py-12 xl:grid-cols-4">
        {RESTAURANT_FEATURES_CONTENT.items.map(
          ({ title, description, illustration }) => (
            <li
              key={title}
              className="flex min-w-0 flex-col items-center gap-2.5 sm:gap-4"
            >
              <Image src={illustration} alt="" width={48} height={48} />
              <div
                data-scroll-reveal
                className="flex flex-col gap-2.5 sm:gap-2"
              >
                <h2
                  className={cn(
                    ebGaramond.className,
                    "text-[22px] leading-[25px] font-medium sm:leading-[26px]",
                  )}
                >
                  {title}
                </h2>
                <p className="text-[13px] leading-[19px] text-text-secondary sm:text-sm sm:leading-5">
                  {description}
                </p>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
