import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";

import styles from "@/components/app/compounds/policy-page.module.css";
import { PolicyContents } from "@/components/app/molecules/policy-contents";
import { POLICY_HELP } from "@/lib/constants/policies";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type { IPolicyPageProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PolicyPage({ policy }: IPolicyPageProps) {
  return (
    <main
      aria-labelledby="policy-title"
      data-policy={policy.variant}
      className={cn(dmSans.className, ebGaramond.variable, styles.page)}
    >
      <section className={styles.hero} aria-labelledby="policy-title">
        <div className={cn("site-container", styles.heroContainer)}>
          <div data-scroll-reveal className={styles.heroCopy}>
            <p className={styles.eyebrow}>{policy.eyebrow}</p>
            <h1 id="policy-title">{policy.heading}</h1>
            <p className={styles.description}>{policy.description}</p>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={cn(styles.photoBounds, styles[policy.variant])}>
            <Image
              {...policy.image}
              fill
              preload
              sizes="(min-width: 1280px) 56vw, 116vw"
            />
          </div>
        </div>
      </section>

      <div data-policy-content className={cn("site-container", styles.content)}>
        <PolicyContents key={policy.path}>
          <ol>
            {policy.sections.map((section, index) => (
              <li key={section._key}>
                <a href={`#${section._key}`}>
                  <span className={styles.contentsNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{section.heading}</span>
                </a>
              </li>
            ))}
          </ol>
          <div className={styles.relatedPolicies}>
            <h2 id="related-policies-title">Related policies</h2>
            <ul aria-labelledby="related-policies-title">
              {policy.relatedPolicies.map((related) => (
                <li key={related.path}>
                  <Link href={related.path}>
                    {related.title}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </PolicyContents>
        <div className={styles.sections}>
          {policy.sections.map((section, index) => (
            <section
              data-scroll-reveal
              key={section._key}
              id={section._key}
              aria-labelledby={`${section._key}-heading`}
              className={styles.policySection}
              tabIndex={-1}
            >
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 id={`${section._key}-heading`}>{section.heading}</h2>
              <div className={styles.sectionCopy}>
                <p>
                  {section.body.map((part) => (
                    <Fragment key={part.text}>
                      {part.href ? (
                        <a href={part.href}>{part.text}</a>
                      ) : (
                        part.text
                      )}
                    </Fragment>
                  ))}
                </p>
                {section.items && (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section
        className={cn(
          "section-divider-subtle section-divider-subtle-bottom",
          styles.help,
        )}
        aria-labelledby="policy-help-title"
      >
        <div className={cn("site-container", styles.helpContainer)}>
          <div data-scroll-reveal className={styles.helpHeading}>
            <p className={styles.eyebrow}>{POLICY_HELP.eyebrow}</p>
            <h2 id="policy-help-title">{POLICY_HELP.heading}</h2>
          </div>
          <div data-scroll-reveal className={styles.helpDetails}>
            <p>{POLICY_HELP.description}</p>
            <div className={styles.contactActions}>
              <a href={`tel:${POLICY_HELP.phone}`}>{POLICY_HELP.phoneLabel}</a>
              <a href={`mailto:${POLICY_HELP.email}`}>{POLICY_HELP.email}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
