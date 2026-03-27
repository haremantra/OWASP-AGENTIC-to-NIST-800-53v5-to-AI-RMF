/**
 * NIST AI-RMF 100-1 Control Descriptions
 * Comprehensive database of all AI-RMF controls with titles, descriptions, and implementation guidance
 * for agentic AI systems
 */

export interface AIRMFControlDesc {
  title: string;
  description: string;
  implementation: string;
  relatedASI: string[];
}

export const NIST_AI_RMF_DESCRIPTIONS: Record<string, AIRMFControlDesc> = {
  // GOVERN Function Controls (GV-1 through GV-7)
  "GV-1": {
    title: "GV-1 — Policies & Processes",
    description: "Establishes and maintains AI governance policies and processes that define how AI systems are developed, deployed, and monitored within the organization.",
    implementation: "For agentic AI systems, governance policies must address agent autonomy levels, goal alignment verification, tool access restrictions, and escalation procedures for ambiguous decisions.",
    relatedASI: ["ASI01", "ASI03", "ASI08"],
  },
  "GV-2": {
    title: "GV-2 — Risk Management Framework",
    description: "Implements a comprehensive risk management framework that identifies, assesses, and mitigates AI-specific risks throughout the system lifecycle.",
    implementation: "Agentic AI risk management must include threat modeling for agent goal hijacking, tool misuse, cascading failures, and supply chain vulnerabilities specific to AI models and agents.",
    relatedASI: ["ASI01", "ASI02", "ASI04", "ASI05", "ASI08"],
  },
  "GV-3": {
    title: "GV-3 — Organizational Practices",
    description: "Defines organizational practices and structures for AI governance, including roles, responsibilities, and accountability mechanisms.",
    implementation: "Establish clear ownership and accountability for agentic AI systems, including incident response teams, model governance boards, and escalation chains for autonomous agent decisions.",
    relatedASI: ["ASI01", "ASI03", "ASI10"],
  },
  "GV-4": {
    title: "GV-4 — Oversight & Accountability",
    description: "Establishes oversight mechanisms and accountability structures to ensure AI systems operate within approved parameters and organizational policies.",
    implementation: "For agentic AI, implement continuous monitoring of agent behavior, goal alignment verification, audit trails for all autonomous decisions, and human-in-the-loop controls for critical actions.",
    relatedASI: ["ASI01", "ASI03", "ASI08", "ASI10"],
  },
  "GV-5": {
    title: "GV-5 — Stakeholder Engagement",
    description: "Engages relevant stakeholders in AI governance decisions, including technical teams, business units, and external parties.",
    implementation: "Ensure transparent communication about agentic AI capabilities and limitations to all stakeholders; establish feedback mechanisms for users to report unexpected agent behavior.",
    relatedASI: ["ASI09"],
  },
  "GV-6": {
    title: "GV-6 — Resource Allocation",
    description: "Allocates appropriate resources (budget, personnel, tools) to support AI governance and risk management activities.",
    implementation: "Allocate sufficient resources for continuous monitoring, testing, and red-teaming of agentic AI systems; invest in tools for detecting agent goal drift and anomalous behavior.",
    relatedASI: ["ASI01", "ASI02", "ASI08"],
  },
  "GV-7": {
    title: "GV-7 — Continuous Improvement",
    description: "Establishes processes for continuous monitoring, evaluation, and improvement of AI governance practices based on lessons learned and emerging risks.",
    implementation: "Implement feedback loops from agent incidents, near-misses, and user reports to continuously refine governance policies and technical controls for agentic AI systems.",
    relatedASI: ["ASI01", "ASI02", "ASI08"],
  },

  // MAP Function Controls (MAP-1 through MAP-6)
  "MAP-1": {
    title: "MAP-1 — Context Establishment",
    description: "Establishes the context for AI system development and deployment, including intended use, stakeholders, and operational environment.",
    implementation: "For agentic AI, clearly define the agent's intended goals, authorized actions, decision boundaries, and escalation triggers before deployment.",
    relatedASI: ["ASI01", "ASI05"],
  },
  "MAP-2": {
    title: "MAP-2 — Impact Characterization",
    description: "Characterizes the potential impacts of AI system failures or misuse, including direct and indirect consequences.",
    implementation: "Conduct impact analysis for agentic AI failures, including cascading effects, data exposure risks, unauthorized tool access, and reputational damage.",
    relatedASI: ["ASI02", "ASI04", "ASI05", "ASI08"],
  },
  "MAP-3": {
    title: "MAP-3 — Risk Assessment",
    description: "Conducts systematic risk assessments to identify and evaluate AI-specific threats and vulnerabilities.",
    implementation: "Perform threat modeling for agentic AI including agent goal hijacking, tool misuse, privilege escalation, and supply chain attacks on models and dependencies.",
    relatedASI: ["ASI01", "ASI02", "ASI03", "ASI04", "ASI05"],
  },
  "MAP-4": {
    title: "MAP-4 — Risk Prioritization",
    description: "Prioritizes identified risks based on likelihood, impact, and organizational risk tolerance.",
    implementation: "Prioritize agentic AI risks based on agent autonomy level, access to critical systems, and potential for cascading failures across dependent systems.",
    relatedASI: ["ASI01", "ASI08"],
  },
  "MAP-5": {
    title: "MAP-5 — Risk Response Planning",
    description: "Develops response plans for identified risks, including mitigation, acceptance, or transfer strategies.",
    implementation: "For agentic AI, develop incident response plans for agent goal drift, unauthorized tool access, and cascading failures; establish rollback procedures and emergency shutdown protocols.",
    relatedASI: ["ASI01", "ASI02", "ASI08", "ASI10"],
  },
  "MAP-6": {
    title: "MAP-6 — Measurement & Monitoring",
    description: "Establishes metrics and monitoring mechanisms to track AI system performance and risk indicators.",
    implementation: "Monitor agentic AI metrics including goal alignment scores, tool access patterns, decision latency, and anomaly detection alerts for unexpected behavior.",
    relatedASI: ["ASI01", "ASI02", "ASI08"],
  },

  // MEASURE Function Controls (MEASURE-1 through MEASURE-5)
  "MEASURE-1": {
    title: "MEASURE-1 — Monitoring & Logging",
    description: "Implements comprehensive monitoring and logging of AI system activities, decisions, and performance metrics.",
    implementation: "Log all agentic AI decisions, tool invocations, goal updates, and anomalies; ensure logs are tamper-proof and retained for audit purposes.",
    relatedASI: ["ASI01", "ASI02", "ASI03", "ASI08"],
  },
  "MEASURE-2": {
    title: "MEASURE-2 — Testing & Evaluation",
    description: "Conducts ongoing testing and evaluation of AI system performance, including adversarial testing and red-teaming.",
    implementation: "Perform continuous red-teaming of agentic AI to identify goal hijacking vulnerabilities, tool misuse scenarios, and cascading failure paths.",
    relatedASI: ["ASI01", "ASI02", "ASI05", "ASI08"],
  },
  "MEASURE-3": {
    title: "MEASURE-3 — Performance Metrics",
    description: "Establishes and tracks performance metrics aligned with AI system objectives and risk indicators.",
    implementation: "Track agentic AI metrics: goal achievement rate, decision correctness, tool access appropriateness, and incident frequency.",
    relatedASI: ["ASI01", "ASI02"],
  },
  "MEASURE-4": {
    title: "MEASURE-4 — Incident Detection",
    description: "Implements mechanisms to detect and report AI-related incidents, anomalies, and security events.",
    implementation: "Deploy anomaly detection for agentic AI behavior, including unusual goal changes, unauthorized tool access, and deviation from expected decision patterns.",
    relatedASI: ["ASI01", "ASI02", "ASI08", "ASI10"],
  },
  "MEASURE-5": {
    title: "MEASURE-5 — Audit & Accountability",
    description: "Maintains audit trails and accountability records for all AI system decisions and actions.",
    implementation: "Maintain immutable audit trails for all agentic AI decisions, including decision rationale, tool invocations, and outcome verification.",
    relatedASI: ["ASI01", "ASI03"],
  },

  // MANAGE Function Controls (MG-1 through MG-4)
  "MG-1": {
    title: "MG-1 — Incident Response",
    description: "Establishes and executes incident response procedures for AI-related security and safety incidents.",
    implementation: "For agentic AI incidents (goal hijacking, tool misuse, cascading failures), activate emergency shutdown, isolate affected agents, and initiate forensic analysis.",
    relatedASI: ["ASI01", "ASI02", "ASI08", "ASI10"],
  },
  "MG-2": {
    title: "MG-2 — Corrective Actions",
    description: "Implements corrective actions to address identified risks and incidents, including system updates and policy changes.",
    implementation: "Apply patches to agentic AI systems, update tool access policies, refine goal definitions, and retrain models based on incident analysis.",
    relatedASI: ["ASI01", "ASI02", "ASI05"],
  },
  "MG-3": {
    title: "MG-3 — Continuous Monitoring",
    description: "Maintains continuous monitoring of AI system performance and risk indicators to detect emerging issues.",
    implementation: "Continuously monitor agentic AI for goal drift, tool misuse patterns, performance degradation, and emerging vulnerabilities in dependencies.",
    relatedASI: ["ASI01", "ASI02", "ASI04", "ASI08"],
  },
  "MG-4": {
    title: "MG-4 — Lessons Learned",
    description: "Captures and applies lessons learned from incidents and monitoring activities to improve AI governance and controls.",
    implementation: "Document agentic AI incidents, near-misses, and red-team findings; share lessons across the organization to prevent similar issues in other AI systems.",
    relatedASI: ["ASI01", "ASI02", "ASI08"],
  },
};
