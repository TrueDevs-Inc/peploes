import { ebGaramond } from "@/lib/fonts";
import { formatMenuPrice } from "@/lib/menu-price";
import type { IMenuDishProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuDish({ dish }: IMenuDishProps) {
  const price = formatMenuPrice(dish.price, dish.priceDecimalPlaces);

  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="min-w-0 text-base leading-6 xl:text-lg xl:leading-5">
          {dish.name}
        </h3>
        {price !== null && (
          <span
            className={cn(
              ebGaramond.className,
              "shrink-0 text-base leading-6 xl:text-[15px] xl:leading-5",
            )}
          >
            {price}
          </span>
        )}
      </div>
      {dish.description && (
        <p
          className={cn(
            ebGaramond.className,
            "mt-0.5 text-[15px] leading-[23px] text-text-secondary xl:text-sm xl:leading-[21px]",
          )}
        >
          {dish.description}
        </p>
      )}
    </li>
  );
}
