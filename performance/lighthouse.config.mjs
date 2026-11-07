import { fileURLToPath } from "node:url";

export default {
  extends: "lighthouse:default",
  artifacts: [
    {
      id: "RepresentativeContent",
      gatherer: fileURLToPath(new URL("./snapshot.mjs", import.meta.url)),
    },
  ],
  audits: [fileURLToPath(new URL("./readiness-audit.mjs", import.meta.url))],
  categories: {
    readiness: {
      title: "Representative content",
      auditRefs: [{ id: "representative-content", weight: 1 }],
    },
  },
};
