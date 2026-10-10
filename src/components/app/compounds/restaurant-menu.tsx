import Image from "next/image";

import { Breadcrumbs } from "@/components/app/compounds/breadcrumb-navigation";
import { MenuBooking } from "@/components/app/compounds/menu-booking";
import { MenuCourse } from "@/components/app/molecules/menu-course";
import { MenuEditorialIntro } from "@/components/app/molecules/menu-editorial-intro";
import { MenuNotes } from "@/components/app/molecules/menu-notes";
import { ROUTES } from "@/lib/constants";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type { IMenuContentProps, IMenuImageStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RestaurantMenu({ menu }: IMenuContentProps) {
  const crop = menu.image?.desktopCrop;
  const imageStyle: IMenuImageStyle = {
    ...(crop && {
      "--menu-image-crop-left": `${crop.leftPercent}%`,
      "--menu-image-crop-top": `${crop.topPx}px`,
      "--menu-image-crop-width": `${crop.widthPercent}%`,
      "--menu-image-crop-aspect": `${crop.aspectRatio}`,
      "--menu-image-crop-rotation": `${crop.rotationDegrees ?? 0}deg`,
    }),
    "--menu-image-scale": menu.image?.desktopScale ?? 1.1,
  };

  return (
    <article className={cn(dmSans.className, "bg-warm-cream text-ink")}>
      <div className="site-container">
        {menu.introLayout === "editorial" ? (
          <MenuEditorialIntro menu={menu} />
        ) : (
          <div
            className={cn(
              "relative grid gap-4 pt-8 pb-7 xl:gap-6 xl:pt-12 xl:pb-0",
              menu.image && "xl:min-h-72 xl:grid-cols-2",
            )}
          >
            <div className="relative z-10">
              <Breadcrumbs
                items={[
                  { name: "Menus", url: ROUTES.MENUS },
                  { name: menu.slug, url: `${ROUTES.MENUS}/${menu.slug}` },
                ]}
                className="[&_ol]:gap-4 [&_ol]:text-sm [&_ol]:leading-5 [&_ol]:font-medium [&_ol]:tracking-[0.08em] [&_ol]:text-peploe-burgundy [&_ol]:uppercase [&_li]:gap-4 [&_[aria-current]]:text-peploe-burgundy"
              />
              <h1
                className={cn(
                  ebGaramond.className,
                  "mt-2 text-[46px] leading-[56px] tracking-[-0.6px] after:mt-[10px] after:block after:h-px after:w-14 after:bg-text-secondary/70 xl:mt-[14px] xl:text-[54px] xl:leading-none xl:tracking-[-1px] xl:after:mt-[14px] xl:after:w-[72px]",
                )}
              >
                {menu.title}
              </h1>
              <p className="mt-3 text-xs leading-[19px] font-medium tracking-[0.06em] text-text-secondary uppercase xl:mt-[14px] xl:whitespace-pre-wrap xl:text-sm xl:leading-5 xl:tracking-[0.1em]">
                {menu.serviceTimes}
              </p>
            </div>
            {menu.image && (
              <div
                className={cn(
                  "relative h-[214px] overflow-hidden sm:h-[320px] xl:absolute xl:top-12 xl:right-0 xl:bottom-0 xl:h-auto xl:w-[56.1%]",
                  crop && "xl:w-full",
                )}
                style={imageStyle}
              >
                <div
                  className={cn(
                    "relative size-full",
                    crop &&
                      "xl:absolute xl:left-(--menu-image-crop-left) xl:top-(--menu-image-crop-top) xl:h-auto xl:w-(--menu-image-crop-width) xl:aspect-(--menu-image-crop-aspect) xl:origin-top-left xl:rotate-(--menu-image-crop-rotation)",
                  )}
                >
                  <Image
                    src={menu.image.src}
                    alt={menu.image.alt}
                    fill
                    sizes={
                      crop
                        ? `(min-width: 1584px) ${(1440 * crop.widthPercent) / 100}px, (min-width: 1280px) calc((100vw - 144px) * ${crop.widthPercent / 100}), (min-width: 640px) 100vw, calc(100vw - 48px)`
                        : "(min-width: 1280px) 57vw, (min-width: 640px) 100vw, calc(100vw - 48px)"
                    }
                    className={cn(
                      "object-contain",
                      !crop &&
                        "xl:origin-left xl:scale-(--menu-image-scale) xl:object-cover xl:object-[center_36%]",
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {menu.courses.map((course) => (
          <MenuCourse key={course._key} course={course} />
        ))}
      </div>
      <MenuNotes menu={menu} />
      <MenuBooking />
    </article>
  );
}
