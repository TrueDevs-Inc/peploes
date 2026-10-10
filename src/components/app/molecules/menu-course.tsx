import { MenuDish } from "@/components/app/molecules/menu-dish";
import { ebGaramond } from "@/lib/fonts";
import type { IMenuCourseProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuCourse({
  course,
  idPrefix = "course",
  compact = false,
}: IMenuCourseProps) {
  if (!course.dishes.length) return null;

  const splitAt =
    course.columns === 1
      ? course.dishes.length
      : (course.firstColumnCount ??
        Math.ceil(course.dishes.length / course.columns));
  const remainingDishes = course.dishes.slice(splitAt);
  const remainingColumnSize = Math.ceil(
    remainingDishes.length / Math.max(1, course.columns - 1),
  );
  const columns = [
    course.dishes.slice(0, splitAt),
    ...Array.from({ length: course.columns - 1 }, (_, index) =>
      remainingDishes.slice(
        index * remainingColumnSize,
        (index + 1) * remainingColumnSize,
      ),
    ),
  ];
  const headingId = `${idPrefix}-${course._key}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "grid gap-5 shadow-[inset_0_1px_0_var(--soft-stone)] py-8 xl:grid-cols-[346fr_950fr] xl:gap-0 xl:py-9",
        compact &&
          "xl:grid-cols-[310fr_986fr] xl:py-4 [&_ul]:xl:pl-[27px] [&_h3]:xl:text-base [&_h3]:xl:leading-5 [&_ul]:xl:space-y-3",
      )}
    >
      <h2
        id={headingId}
        className={cn(
          ebGaramond.className,
          "text-[38px] leading-[42px] tracking-[-0.4px] before:mb-2 before:block before:h-0.5 before:w-[42px] before:bg-peploe-burgundy xl:pr-9 xl:text-[42px] xl:leading-[0.98] xl:tracking-[-0.7px] xl:before:mb-3 xl:before:w-11",
          compact &&
            "xl:text-[34px] xl:leading-[1.1] xl:before:mb-2 xl:before:w-9",
        )}
      >
        {course.heading}
      </h2>
      <div
        className={cn(
          "grid min-w-0 gap-4 xl:gap-x-9 xl:gap-y-0",
          course.columns === 2 && "xl:grid-cols-2",
          course.columns === 3 && "xl:grid-cols-3",
          compact && "xl:gap-x-[27px]",
          !compact &&
            !course.dishes.some((dish) => dish.description) &&
            "xl:min-h-[118px]",
        )}
      >
        {columns
          .filter((dishes) => dishes.length > 0)
          .map((dishes) => (
            <ul
              key={dishes[0]._key}
              className="space-y-4 xl:space-y-5 xl:border-l xl:border-soft-stone xl:pl-9"
            >
              {dishes.map((dish) => (
                <MenuDish key={dish._key} dish={dish} />
              ))}
            </ul>
          ))}
      </div>
    </section>
  );
}
