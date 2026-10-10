import { ebGaramond } from "@/lib/fonts";
import { formatMenuPrice } from "@/lib/menu-price";
import type { IWineCategoryProps, IWineCategoryStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WineCategory({
  category,
  sectionKey,
  column,
  rowSpan,
  continued,
}: IWineCategoryProps) {
  const hasOrigins = category.wines.some((wine) => Boolean(wine.region));
  const id = `${sectionKey}-${category._key}`;
  const columnCount =
    2 + Number(category.showVintage) + Number(category.showGlass);
  const priceCellClassName = cn(
    "pb-[14px] text-right align-top leading-6 xl:text-center",
    hasOrigins && "pt-1 leading-5 xl:pt-0 xl:leading-6",
    category.compactVintageHeading && "pt-0.5",
  );
  const style: IWineCategoryStyle = {
    "--wine-column": column,
    "--wine-row-span": rowSpan,
    "--wine-top-padding": `${category.mobileTopPadding ?? 32}px`,
    "--wine-heading-gap": `${category.mobileHeadingGap ?? 16}px`,
  };
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      style={style}
      className={cn(
        "relative scroll-mt-40 border-soft-stone not-first:pt-(--wine-top-padding) not-first:before:absolute not-first:before:top-[calc(var(--wine-top-padding)-25px)] not-first:before:h-0.5 not-first:before:w-[42px] not-first:before:bg-peploe-burgundy xl:col-start-(--wine-column) xl:row-span-(--wine-row-span) xl:not-first:border-t xl:not-first:pt-8 xl:before:hidden",
        category.compactVintageHeading &&
          "border-t-2 pt-8 pb-[11px] before:absolute before:top-[27px] before:h-0.5 before:w-[42px] before:bg-peploe-burgundy not-first:pt-8 not-first:before:top-[27px] xl:border-t-0 xl:pt-0 xl:pb-0 xl:not-first:pt-8",
        continued &&
          hasOrigins &&
          category.wines.length > 1 &&
          "xl:not-first:pt-4",
        !continued && "xl:not-first:border-t-0 xl:not-first:pt-0",
        column === 2 &&
          "xl:after:absolute xl:after:inset-y-0 xl:after:-left-[57px] xl:after:w-px xl:after:bg-soft-stone",
      )}
    >
      <h3
        id={`${id}-heading`}
        className={cn(
          ebGaramond.className,
          "mb-(--wine-heading-gap) text-[34px] leading-10 tracking-[-0.6px] xl:mb-4 xl:text-[32px] xl:leading-[38px]",
          category.emphasized && "xl:text-[42px] xl:leading-[46px]",
        )}
      >
        {category.heading}
      </h3>
      <table className="w-full table-fixed text-sm leading-5">
        <caption className="sr-only">
          {category.heading} wine list, prices in euro
        </caption>
        <thead
          className={cn(
            "text-right text-[10px] font-medium tracking-[0.04em] text-peploe-burgundy uppercase xl:text-xs",
            category.compactVintageHeading &&
              "[&_th]:pb-6 [&_th]:align-top xl:[&_th]:pb-4",
          )}
        >
          <tr>
            <th scope="col" className="pb-4 text-left font-medium">
              <span className="xl:sr-only">
                {hasOrigins ? "Origin" : "Wine"}
              </span>
            </th>
            {category.showVintage && (
              <th
                scope="col"
                className="w-[60px] pb-4 font-medium xl:w-20 xl:text-center"
              >
                <span
                  className={cn(
                    category.compactVintageHeading &&
                      "ml-auto block w-7 break-all text-center leading-3 xl:mx-auto xl:w-auto xl:break-normal xl:leading-4",
                  )}
                >
                  Vintage
                </span>
              </th>
            )}
            {category.showGlass && (
              <th
                scope="col"
                className="w-[54px] pb-4 font-medium xl:w-20 xl:text-center"
              >
                Glass
              </th>
            )}
            <th
              scope="col"
              className="w-[60px] pb-4 font-medium xl:w-20 xl:text-center"
            >
              Bottle
            </th>
          </tr>
        </thead>
        {category.wines.map((wine) => (
          <tbody key={wine._key}>
            <tr className={hasOrigins ? "xl:hidden" : "hidden"}>
              <th
                scope="rowgroup"
                colSpan={columnCount}
                className="text-left text-base leading-6 font-normal"
              >
                {wine.name}
              </th>
            </tr>
            <tr>
              <th
                scope="row"
                className={cn(
                  "pb-[14px] text-left align-top text-base leading-6 font-normal xl:table-cell",
                  hasOrigins && "hidden xl:pb-4",
                )}
              >
                {wine.name}
                {wine.region && (
                  <span
                    className={cn(
                      ebGaramond.className,
                      "block text-sm leading-5 text-text-secondary",
                    )}
                  >
                    {wine.region}
                  </span>
                )}
              </th>
              <td
                className={cn(
                  ebGaramond.className,
                  "pb-4 pt-1 pr-1 text-sm leading-5 text-text-secondary xl:hidden",
                  category.compactVintageHeading && "pt-0.5 pb-[17px]",
                  !hasOrigins && "hidden",
                )}
              >
                {wine.region}
              </td>
              {category.showVintage && (
                <td className={cn(priceCellClassName, "text-text-secondary")}>
                  {wine.vintage ?? "–"}
                </td>
              )}
              {category.showGlass && (
                <td className={priceCellClassName}>
                  {formatMenuPrice(wine.glass) ?? "–"}
                </td>
              )}
              <td className={priceCellClassName}>
                {formatMenuPrice(wine.bottle) ?? "–"}
              </td>
            </tr>
          </tbody>
        ))}
      </table>
    </section>
  );
}
