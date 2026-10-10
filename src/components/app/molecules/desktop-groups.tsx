import Image from "next/image";

import { NavigationShelf } from "@/components/app/molecules/navigation-shelf";
import { NavigationShelfLink } from "@/components/app/molecules/navigation-shelf-link";
import { NAVBAR_CONTENT } from "@/lib/constants";
import { GROUPS_SHELF_CONTENT } from "@/lib/constants/groups-shelf";

export function DesktopGroups() {
  return (
    <NavigationShelf
      eyebrow={GROUPS_SHELF_CONTENT.eyebrow}
      heading={GROUPS_SHELF_CONTENT.heading}
      description={GROUPS_SHELF_CONTENT.description}
      introClassName="w-80"
    >
      <ul
        aria-label={NAVBAR_CONTENT.groupsLabel}
        className="grid min-w-0 flex-1 grid-cols-3 gap-9"
      >
        {GROUPS_SHELF_CONTENT.destinations.map(
          ({ label, description, image, href }) => (
            <li key={label} className="flex min-w-0 flex-col gap-4">
              <div className="relative h-[132px] w-full">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="calc((100vw - 592px) / 3)"
                  className="object-cover"
                />
              </div>
              <NavigationShelfLink
                label={label}
                description={description}
                href={href}
              />
            </li>
          ),
        )}
      </ul>
    </NavigationShelf>
  );
}
