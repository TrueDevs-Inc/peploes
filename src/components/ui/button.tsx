import { Slot } from "@radix-ui/react-slot";
import { cloneElement, isValidElement, type ReactNode } from "react";

import styles from "@/components/ui/button.module.css";
import { buttonVariants } from "@/lib/constants/button";
import type { IButtonProps } from "@/lib/types";
import { cn } from "@/lib/utils";

function Button({
  className,
  variant,
  size,
  asChild = false,
  hoverArea,
  children,
  ...props
}: IButtonProps) {
  const Comp = asChild ? Slot : "button";
  const wrapContent =
    hoverArea === "content" ||
    (hoverArea !== "control" &&
      (variant === "brand-text" || variant === "brand-secondary-inverse"));
  let content = children;

  if (wrapContent) {
    const child =
      asChild && isValidElement<{ children?: ReactNode }>(children)
        ? children
        : null;
    const label = (
      <span className={styles.content}>
        {child ? child.props.children : children}
      </span>
    );
    content = child ? cloneElement(child, undefined, label) : label;
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-hover-area={wrapContent ? "content" : "control"}
      className={cn(
        buttonVariants({ variant, size, className }),
        wrapContent && styles.textAction,
        variant === "brand-secondary-inverse" && styles.boxedAction,
      )}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };
