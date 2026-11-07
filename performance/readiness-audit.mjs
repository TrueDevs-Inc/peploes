import { Audit } from "lighthouse/core/audits/audit.js";

export default class RepresentativeReadiness extends Audit {
  static get meta() {
    return {
      id: "representative-content",
      title: "Measured document content is available",
      failureTitle: "Measured document content is unavailable",
      description:
        "Retains document readiness separately from the Performance score.",
      requiredArtifacts: ["RepresentativeContent"],
    };
  }

  static audit(artifacts) {
    const snapshot = artifacts.RepresentativeContent;
    return {
      score: snapshot.heading && snapshot.text.length >= 120 ? 1 : 0,
      details: { type: "debugdata", snapshot },
    };
  }
}
