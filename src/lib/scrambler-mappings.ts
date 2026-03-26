import type { ASIRelevance } from './scrambler-types';

// ─── CONTROL_STATE_TO_FAMILIES ──────────────────────────────────────
// Maps each control_state boolean to the NIST 800-53 families it governs.
// When a boolean is false, all families in its array are "Broken" for any
// ASI risk that implicates them.
//
// Derivation: Crosswalk rationale analysis across all 10 ASI risks.
// Primary boolean = most frequent causal agent in rationale text.
// Contested families (AC, AU, CM, CA, SI) resolved by editorial rule:
//   "The boolean whose name most closely matches the family's purpose."
// Secondary booleans documented in SECONDARY_BOOLEANS for Phase 1.1.
//
// Decision Point: DP-04 (confidence 0.72) + DP-04a (confidence 0.68)
// Phase 1 uses primary-only model. Phase 1.1 activates secondaries.

export const CONTROL_STATE_TO_FAMILIES: Record<string, string[]> = {
  has_agent_limits: [
    "AC",  // Access Control — agent permissions, least privilege, tool access boundaries
    "SC",  // System & Comms Protection — sandboxes, boundary protection, process isolation
  ],
  has_identity_management: [
    "IA",  // Identification & Authentication — cryptographic identity, mTLS, OAuth tokens
  ],
  has_oversight_design: [
    "PL",  // Planning — rules of behavior, human-agent interaction governance
    "PM",  // Program Management — security workforce training, automation bias awareness
  ],
  has_dev_controls: [
    "CM",  // Configuration Management — baselines, change control, least functionality
    "SA",  // System & Services Acquisition — third-party vetting, supply chain protection
    "SR",  // Supply Chain Risk Mgmt — AIBOM governance, provenance, signature validation
    "MP",  // Media Protection — not mapped in crosswalk; assigned here as default owner
    "PE",  // Physical & Environmental — not mapped in crosswalk; assigned here as default owner
  ],
  has_testing: [
    "CA",  // Assessment & Authorization — penetration testing, continuous monitoring
    "RA",  // Risk Assessment — blast-radius assessment, vulnerability monitoring
  ],
  has_phased_deployment: [
    "CP",  // Contingency Planning — business continuity, recovery, digital twin replay
  ],
  has_monitoring: [
    "AU",  // Audit & Accountability — logging, audit trails, non-repudiation
    "IR",  // Incident Response — circuit breakers, kill switches, quarantine
    "SI",  // System & Info Integrity — input validation, integrity verification, scanning
  ],
};

// ─── SECONDARY_BOOLEANS ─────────────────────────────────────────────
// Documents which additional booleans contribute to each contested family.
// NOT used in Phase 1 heatmap rendering. Activated in Phase 1.1 after
// practitioner validation confirms or corrects the primary assignments.

export const SECONDARY_BOOLEANS: Record<string, string[]> = {
  AC: ["has_identity_management", "has_oversight_design"],  // AC-2 account lifecycle, AC-3 friction
  AU: ["has_identity_management"],                          // AU-10 delegation chain logging
  CM: ["has_agent_limits", "has_phased_deployment"],        // CM-7 least functionality, CM staged rollout
  CA: ["has_monitoring"],                                   // CA-7 continuous monitoring
  SI: ["has_dev_controls"],                                 // SI-7 integrity verification during dev
};

// ─── FAMILY_TO_PRIMARY_BOOLEAN ──────────────────────────────────────
// Reverse lookup: given a NIST family, which boolean governs it?
// Used by the evaluator to determine cell state.

export const FAMILY_TO_PRIMARY_BOOLEAN: Record<string, string> = {
  AC: "has_agent_limits",
  AU: "has_monitoring",
  CA: "has_testing",
  CM: "has_dev_controls",
  CP: "has_phased_deployment",
  IA: "has_identity_management",
  IR: "has_monitoring",
  MP: "has_dev_controls",
  PE: "has_dev_controls",
  PL: "has_oversight_design",
  PM: "has_oversight_design",
  RA: "has_testing",
  SA: "has_dev_controls",
  SC: "has_agent_limits",
  SI: "has_monitoring",
  SR: "has_dev_controls",
};

// ─── RISK_TO_ASI ────────────────────────────────────────────────────
// Maps each IMDA risk category to the ASI risks it implicates.
// Weight (0.0–1.0) reflects how directly the ASI risk's threat model
// matches the IMDA risk category. Used to determine which ASI rows
// light up in the heatmap and with what visual intensity (opacity).
//
// Derivation: Crosswalk evidence strings + NIST/AI-RMF rationales
// analyzed for causal alignment between IMDA risk categories and
// ASI threat models.
//
// Decision Point: DP-02 (confidence 0.78)
// Weights are editorial estimates. Practitioner validation required.

export const RISK_TO_ASI: Record<string, ASIRelevance[]> = {
  Erroneous: [
    {
      asiId: "ASI06",
      weight: 0.70,
      rationale: "Corrupted memory produces erroneous outputs; agent acts on false information.",
      imdaRef: "Section 3.1: Erroneous outputs — hallucination, factual errors, corrupted context",
    },
    {
      asiId: "ASI08",
      weight: 0.90,
      rationale: "Cascading failures are the primary mechanism by which erroneous outputs compound.",
      imdaRef: "Section 3.1: Compounding errors across agent chains",
    },
    {
      asiId: "ASI09",
      weight: 0.80,
      rationale: "Automation bias causes humans to approve erroneous agent outputs without verification.",
      imdaRef: "Section 3.5: Automation bias as contributor to erroneous outcome acceptance",
    },
  ],
  Unauthorised: [
    {
      asiId: "ASI01",
      weight: 0.90,
      rationale: "Goal hijack is unauthorized redirection of agent purpose.",
      imdaRef: "Section 3.1: Unauthorised actions — goal manipulation as primary vector",
    },
    {
      asiId: "ASI03",
      weight: 0.95,
      rationale: "Identity and privilege abuse is definitionally about unauthorized access.",
      imdaRef: "Section 3.4: Agent Identity and Access Control",
    },
    {
      asiId: "ASI05",
      weight: 0.70,
      rationale: "Unexpected code execution is unauthorized in the sense that the code was not sanctioned.",
      imdaRef: "Section 3.1: Unauthorised actions — code execution without approval",
    },
    {
      asiId: "ASI10",
      weight: 0.80,
      rationale: "Rogue agents act without authorization; behavior may drift from authorized to unauthorized over time.",
      imdaRef: "Section 3.1: Agents deviating from intended purpose",
    },
  ],
  Biased: [
    {
      asiId: "ASI06",
      weight: 0.80,
      rationale: "Poisoned memory introduces systematic bias into agent reasoning via corrupted RAG or manipulated long-term memory.",
      imdaRef: "Section 3.1: Biased outcomes — data quality and context integrity as bias sources",
    },
    {
      asiId: "ASI09",
      weight: 0.90,
      rationale: "Automation bias is itself a form of bias — human cognitive bias toward trusting the agent. IMDA extends bias beyond model bias to human-agent interaction bias.",
      imdaRef: "Section 3.5: Automation Bias — entire subsection dedicated to cognitive bias in human-agent systems",
    },
  ],
  DataBreach: [
    {
      asiId: "ASI01",
      weight: 0.80,
      rationale: "Goal hijack as data exfiltration vector (EchoLeak zero-click exfiltration via M365 Copilot).",
      imdaRef: "Section 3.1: Data breaches — agent-mediated data exfiltration",
    },
    {
      asiId: "ASI04",
      weight: 0.70,
      rationale: "Supply chain compromise can lead to data breach via tampered component exfiltration.",
      imdaRef: "Section 3.6: Supply chain risks — tampered components as data exposure vector",
    },
    {
      asiId: "ASI06",
      weight: 0.90,
      rationale: "Memory stores contain sensitive data; cross-tenant vector bleed and unauthorized memory access are direct breach scenarios.",
      imdaRef: "Section 3.1: Data breaches — agent memory stores as novel attack surface",
    },
    {
      asiId: "ASI07",
      weight: 0.75,
      rationale: "Unencrypted inter-agent channels expose data in transit via spoofing and replay attacks.",
      imdaRef: "Section 3.1: Data breaches — communication channel security",
    },
  ],
  Disruption: [
    {
      asiId: "ASI02",
      weight: 0.80,
      rationale: "Tool misuse causes service disruption — destructive tool invocations, resource exhaustion.",
      imdaRef: "Section 3.1: Disruption — tool misuse as disruption vector",
    },
    {
      asiId: "ASI05",
      weight: 0.75,
      rationale: "Unexpected code execution crashes systems, corrupts environments, creates persistent backdoors.",
      imdaRef: "Section 3.1: Disruption — uncontrolled code execution in production",
    },
    {
      asiId: "ASI08",
      weight: 0.95,
      rationale: "Cascading failures are the primary mechanism for system-wide disruption across multi-agent systems.",
      imdaRef: "Section 3.1: Cascading failures — primary systemic disruption mechanism",
    },
    {
      asiId: "ASI10",
      weight: 0.85,
      rationale: "Rogue agents disrupt operations by deviating from intended behavior while appearing compliant.",
      imdaRef: "Section 3.1: Rogue behavior as disruption risk",
    },
  ],
};
