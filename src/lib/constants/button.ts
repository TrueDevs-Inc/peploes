import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        "brand-primary":
          "bg-peploe-burgundy text-warm-cream shadow-none hover:bg-button-primary-hover",
        "brand-primary-inverse":
          "bg-warm-cream text-peploe-burgundy shadow-none hover:bg-warm-cream/90",
        "brand-secondary-inverse":
          "border border-warm-cream bg-transparent text-warm-cream shadow-none hover:border-warm-cream hover:bg-warm-cream/12",
        "brand-text": "text-peploe-burgundy underline-offset-4 hover:underline",
        "brand-nav":
          "text-ink underline-offset-4 hover:text-peploe-burgundy hover:underline",
        "brand-contact":
          "border border-peploe-burgundy/25 bg-transparent text-peploe-burgundy shadow-none hover:border-peploe-burgundy/60 hover:bg-peploe-burgundy/6",
      },
      size: {
        cta: "h-11 w-fit max-w-full rounded-[4px] px-5 py-2.5 text-base leading-6 has-[>svg]:px-5",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    compoundVariants: [
      {
        variant: "brand-contact",
        size: "cta",
        className:
          "pl-4 text-[15px] leading-[22px] focus-visible:border-peploe-burgundy focus-visible:ring-peploe-burgundy/40 has-[>svg]:pl-4",
      },
      {
        variant: [
          "brand-primary",
          "brand-primary-inverse",
          "brand-secondary-inverse",
          "brand-text",
          "brand-nav",
          "brand-contact",
        ],
        className:
          "cursor-pointer transition-colors duration-(--duration-interaction) motion-reduce:transition-none",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
