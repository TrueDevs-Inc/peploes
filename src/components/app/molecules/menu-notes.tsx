import { ChevronDown, Info } from "lucide-react";

import { FOCUS_RING } from "@/lib/constants";
import { ebGaramond, ebGaramondItalic } from "@/lib/fonts";
import type { IMenuNotesProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuNotes({
  menu,
  compact = false,
  collection = false,
  allergenHeadingClassName,
}: IMenuNotesProps) {
  const hasNotes = Boolean(menu.offer) || menu.notes.length > 0;
  if (!hasNotes && !menu.allergens) return null;

  const notes = hasNotes && (
    <MenuNotesText menu={menu} compact={compact} collection={collection} />
  );

  const allergens = (
    <MenuAllergenInformation
      menu={menu}
      compact={compact}
      collection={collection}
      allergenHeadingClassName={allergenHeadingClassName}
    />
  );

  return (
    <div
      className={cn(
        "bg-peploe-burgundy text-warm-cream",
        collection && "xl:bg-[#891827]",
      )}
    >
      <div
        className={cn(
          "site-container grid gap-8 py-8 xl:gap-0 xl:py-[38px]",
          menu.allergens && hasNotes && "xl:grid-cols-2",
          !compact && "xl:min-h-[194px]",
          collection && "xl:min-h-[186px] xl:py-9",
          compact && "xl:gap-8 xl:py-3",
          compact && menu.allergens && hasNotes && "xl:grid-cols-[1fr_360px]",
        )}
      >
        {compact ? allergens : notes}
        {compact ? notes : allergens}
      </div>
    </div>
  );
}

function MenuNotesText({ menu, compact, collection }: IMenuNotesProps) {
  return (
    <div
      data-scroll-reveal
      className={cn(
        "xl:pr-16",
        compact &&
          "border-t border-warm-cream/40 pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6 xl:pr-0",
      )}
    >
      {menu.offer && (
        <p
          className={cn(
            ebGaramond.className,
            "text-[27px] leading-[35px] after:mt-4 after:block after:h-px after:w-9 after:bg-warm-cream/60 xl:text-[30px] xl:leading-[38px]",
            collection && "text-[30px] leading-8",
          )}
        >
          {menu.offer}
        </p>
      )}
      {menu.notes.length > 0 && (
        <div
          className={cn(
            "text-sm leading-[21px]",
            menu.offer && "mt-4",
            compact && [
              ebGaramondItalic.className,
              "text-lg leading-[22px] xl:text-base xl:leading-[18px]",
            ],
          )}
        >
          {menu.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuAllergenInformation({
  menu,
  compact,
  collection,
  allergenHeadingClassName,
}: IMenuNotesProps) {
  if (!menu.allergens) return null;
  const hasNotes = Boolean(menu.offer) || menu.notes.length > 0;
  return (
    <details
      data-scroll-reveal
      open
      className={cn(
        "group relative min-h-11",
        compact && "xl:pl-[190px]",
        hasNotes &&
          !compact &&
          "border-t border-warm-cream/40 pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-16",
      )}
    >
      <summary
        className={cn(
          ebGaramond.className,
          FOCUS_RING,
          "flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-xl leading-6 text-[#f1f1f1] focus-visible:ring-warm-cream [&::-webkit-details-marker]:hidden xl:justify-start xl:min-h-6 xl:gap-3 xl:text-lg",
          compact &&
            "gap-[14px] xl:absolute xl:top-0 xl:left-0 xl:gap-3 xl:text-base",
          collection && "xl:text-[19px]",
          allergenHeadingClassName,
        )}
      >
        {compact && <Info aria-hidden="true" className="size-4 shrink-0" />}
        <span className={compact ? "flex-1" : undefined}>
          {menu.allergens.heading}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 -rotate-90 group-open:rotate-0",
            compact && "xl:hidden",
          )}
        />
      </summary>
      <p
        className={cn(
          "mt-1 whitespace-pre-line text-sm leading-[21px] xl:mt-[18px] xl:max-w-[540px]",
          compact &&
            "xl:mt-0 xl:max-w-none xl:pt-1 xl:text-xs xl:leading-[18px]",
        )}
      >
        {menu.allergens.description}
      </p>
    </details>
  );
}
