"use client";

import Image from "next/image";
import { useState } from "react";
import type { IMenuIntroImageProps } from "@/lib/types";

export function MenuIntroImage({
  image,
  sizes,
  className,
}: IMenuIntroImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      loading="eager"
      sizes={sizes}
      className={className}
      unoptimized={failedSource === image.src}
      onError={() => setFailedSource(image.src)}
    />
  );
}
