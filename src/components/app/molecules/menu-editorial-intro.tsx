import { MenuIntroImage } from "@/components/app/atoms/menu-intro-image";
import { Breadcrumbs } from "@/components/app/compounds/breadcrumb-navigation";
import { MENU_ROUTES, ROUTES } from "@/lib/constants";
import { ebGaramond, ebGaramondItalic } from "@/lib/fonts";
import type {
  IMenuEditorialImageProps,
  IMenuEditorialIntroProps,
  IMenuImageStyle,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuEditorialIntro({
  menu,
  compact = false,
}: IMenuEditorialIntroProps) {
  const hasImageAndAside = Boolean(menu.image && menu.aside);
  return (
    <header
      className={cn(
        "grid gap-5 pt-8 pb-8 xl:min-h-60 xl:items-center xl:gap-8 xl:py-6",
        (menu.image || menu.aside) && "xl:grid-cols-2",
        hasImageAndAside && "xl:grid-cols-[minmax(0,1fr)_352px_220px]",
        compact && "xl:min-h-40 xl:py-[26px]",
        compact && menu.description && "xl:pb-[21px]",
        compact &&
          hasImageAndAside &&
          "xl:grid-cols-[minmax(0,1fr)_134px_220px]",
        menu.serviceTimes && "xl:min-h-72 xl:items-start xl:pt-12 xl:pb-0",
      )}
    >
      <MenuEditorialHeading menu={menu} compact={compact} />
      {menu.image && (
        <MenuEditorialImage
          image={menu.image}
          compact={compact}
          imageBeforeAside={menu.imageBeforeAside}
        />
      )}
      {menu.aside && (
        <p
          data-scroll-reveal
          className={cn(
            ebGaramondItalic.className,
            "text-lg leading-6 text-text-secondary after:mt-3 after:block after:h-0.5 after:w-14 after:bg-peploe-burgundy xl:order-3 xl:self-center xl:text-base xl:leading-[22px] xl:after:mt-4",
            menu.serviceTimes && "xl:-translate-y-6 xl:text-lg xl:leading-6",
          )}
        >
          {menu.aside}
        </p>
      )}
    </header>
  );
}

function MenuEditorialImage({
  image,
  compact,
  imageBeforeAside,
}: IMenuEditorialImageProps) {
  const imageStyle: IMenuImageStyle = {
    "--menu-image-scale": image.scale ?? 1,
    "--menu-image-desktop-scale": image.desktopScale ?? image.scale ?? 1,
    "--menu-image-rotation": `${image.rotation ?? 0}deg`,
    "--menu-image-position": image.mobilePosition ?? "center",
    "--menu-image-desktop-position": image.desktopPosition ?? "center",
  };
  return (
    <div
      className={cn(
        "relative h-[214px] overflow-hidden xl:order-2 xl:h-48",
        compact && "h-[170px] xl:h-[108px]",
        image.rotation && "xl:h-60",
        image.fit === "cover" &&
          "xl:-my-6 xl:mr-[23px] xl:h-60 xl:w-[258px] xl:justify-self-end",
        !imageBeforeAside && "order-3",
        image.scale &&
          "h-[206px] xl:-my-6 xl:h-[250px] xl:translate-y-11 xl:overflow-visible",
      )}
      style={imageStyle}
    >
      <MenuIntroImage
        image={image}
        sizes={
          image.fit === "cover"
            ? "(min-width: 1280px) 258px, calc(100vw - 48px)"
            : "(min-width: 1280px) 528px, calc(100vw - 48px)"
        }
        className={cn(
          "object-contain rotate-(--menu-image-rotation) xl:scale-(--menu-image-desktop-scale)",
          image.fit === "cover" &&
            "object-cover object-(--menu-image-position) xl:object-(--menu-image-desktop-position)",
          image.scale &&
            "origin-bottom scale-(--menu-image-scale) object-cover",
        )}
      />
    </div>
  );
}

function MenuEditorialHeading({ menu, compact }: IMenuEditorialIntroProps) {
  const hasCompactDescription = compact && Boolean(menu.description);
  return (
    <div data-scroll-reveal>
      <Breadcrumbs
        items={[
          { name: "Menus", url: ROUTES.MENUS },
          {
            name:
              menu.slug === "pre-theatre"
                ? menu.slug
                : menu.slug.replaceAll("-", " "),
            url: MENU_ROUTES[menu.slug],
          },
        ]}
        className={cn(
          "[&_ol]:gap-4 [&_ol]:text-sm [&_ol]:leading-5 [&_ol]:font-medium [&_ol]:tracking-[0.08em] [&_ol]:text-peploe-burgundy [&_ol]:uppercase [&_li]:gap-4 [&_[aria-current]]:text-peploe-burgundy",
          hasCompactDescription &&
            "xl:[&_ol]:gap-2.5 xl:[&_ol]:text-[10px] xl:[&_ol]:leading-[14px] xl:[&_ol]:tracking-[0.1em] xl:[&_li]:gap-2.5",
        )}
      />
      <h1
        className={cn(
          ebGaramond.className,
          "mt-2 whitespace-pre-line text-[46px] leading-none tracking-[-1px] after:mt-5 after:block after:h-px after:w-14 after:bg-text-secondary/70 xl:mt-[14px] xl:text-[54px] xl:leading-[52px] xl:tracking-[-1px] xl:after:hidden",
          compact && "xl:text-[46px]",
          hasCompactDescription && "xl:mt-0.5 xl:tracking-normal",
          menu.serviceTimes &&
            "leading-[56px] after:mt-[10px] xl:leading-none xl:after:mt-[14px] xl:after:block xl:after:w-[72px]",
        )}
      >
        {menu.title}
      </h1>
      {menu.description && (
        <p
          className={cn(
            !compact && ebGaramond.className,
            "mt-4 text-lg leading-6 text-text-secondary",
            compact &&
              "text-sm leading-[21px] xl:mt-3.5 xl:max-w-[600px] xl:leading-5",
          )}
        >
          {menu.description}
        </p>
      )}
      {menu.serviceTimes && (
        <p className="mt-3 text-xs leading-[19px] font-medium tracking-[0.06em] text-text-secondary uppercase xl:mt-[14px] xl:text-sm xl:leading-5 xl:tracking-[0.1em]">
          {menu.serviceTimes}
        </p>
      )}
    </div>
  );
}
