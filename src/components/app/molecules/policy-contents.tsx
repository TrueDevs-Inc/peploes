"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import styles from "@/components/app/molecules/policy-contents.module.css";
import { POLICY_CONTENTS_LABEL } from "@/lib/constants/policies";
import type { IPolicyContentsProps } from "@/lib/types";

export function PolicyContents({ children }: IPolicyContentsProps) {
  const [expanded, setExpanded] = useState(false);
  const contentsId = useId();

  return (
    <nav
      className={styles.contents}
      aria-label={POLICY_CONTENTS_LABEL}
      data-expanded={expanded}
    >
      <h2>
        <span className={styles.label}>{POLICY_CONTENTS_LABEL}</span>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentsId}
          onClick={() => setExpanded(!expanded)}
        >
          {POLICY_CONTENTS_LABEL}
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      </h2>
      <div id={contentsId} className={styles.links}>
        {children}
      </div>
    </nav>
  );
}
