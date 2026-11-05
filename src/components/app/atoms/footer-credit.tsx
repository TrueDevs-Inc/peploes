import { FOOTER_CREDIT } from "@/lib/constants/footer";
import { inter } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function FooterCredit() {
  return (
    <div
      className={cn(
        inter.className,
        "mt-[clamp(16px,1.5vw,18px)] text-center text-[clamp(12px,1.125vw,13.5px)] leading-[clamp(16px,1.5vw,18px)] text-ink/80",
      )}
    >
      <a
        href={FOOTER_CREDIT.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-block min-h-[clamp(24px,2.25vw,27px)] content-center cursor-pointer underline decoration-ink/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        {FOOTER_CREDIT.prefix}{" "}
        <span className="font-bold transition-colors duration-(--duration-base) ease-(--ease-organic) group-hover:text-truedevs-orange group-focus-visible:text-truedevs-orange">
          {FOOTER_CREDIT.brandEmphasis}
        </span>
        <span className="font-light">{FOOTER_CREDIT.brandSuffix}</span>
      </a>
    </div>
  );
}
