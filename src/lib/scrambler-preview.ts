// scrambler-preview.ts

// --- DATA MAPPINGS ---

const riskContent: { [key: string]: { asi: string[]; narrative: string } } = {
  Erroneous: {
    asi: ["ASI01 (Agentic Goal Hijacking)", "ASI05 (Unexpected Code Execution)"],
    narrative: "This scenario tests for erroneous outcomes, where the agent produces incorrect or unintended results.",
  },
  Unauthorised: {
    asi: ["ASI02 (Tool Misuse and Weaponization)", "ASI03 (Identity and Privilege Abuse)"],
    narrative: "This scenario focuses on unauthorised actions, where the agent performs activities beyond its designated permissions.",
  },
  Biased: {
    asi: ["ASI06 (Corrupted Memory and Poisoned Context)", "ASI09 (Automation Bias and Oversight Gaps)"],
    narrative: "This scenario investigates biased behavior, where the agent exhibits systemic prejudice or unfairness in its decisions.",
  },
  DataBreach: {
    asi: ["ASI04 (Supply Chain and Dependency Attacks)", "ASI07 (Insecure Multi-Agent Communication)"],
    narrative: "This scenario simulates a data breach, where sensitive information is accessed or exfiltrated by the agent system.",
  },
  Disruption: {
    asi: ["ASI08 (Cascading Failures in Multi-Agent Systems)", "ASI10 (Rogue Agent Behavior)"],
    narrative: "This scenario models a service disruption, where the agent system becomes unreliable or completely unavailable.",
  },
};

const archetypeContent: { [key: string]: { narrative: string } } = {
  Single: {
    narrative: "It utilizes a single agent architecture, where failures are generally contained but oversight can be limited.",
  },
  Sequential: {
    narrative: "It is built on a sequential agent architecture, where errors can propagate linearly through the chain of command.",
  },
  Supervisor: {
    narrative: "It employs a supervisor-worker architecture, where a central agent's failure can compromise all subordinate agents.",
  },
  Swarm: {
    narrative: "It operates as a decentralized swarm, where failures can cascade unpredictably and emergent behavior is a primary concern.",
  },
};

const postureContent: { [key: string]: { narrative: string } } = {
  Minimal: {
    narrative: "With Minimal governance, 5-6 of the 7 key control areas are disabled, meaning critical NIST families like Access Control (AC), Audit and Accountability (AU), Identification and Authentication (IA), and System and Information Integrity (SI) are likely unprotected.",
  },
  Standard: {
    narrative: "Under Standard governance, 2-3 of the 7 key control areas are disabled, which can create significant gaps in families such as Incident Response (IR), Configuration Management (CM), or Contingency Planning (CP).",
  },
  Full: {
    narrative: "With Full governance, a maximum of one control area is disabled, establishing a robust defense-in-depth posture that covers nearly all 16 relevant NIST 800-53 control families.",
  },
};

// --- FUNCTION ---

export function generateScenarioPreview(
  riskCategory: string,
  archetype: string,
  posture: string
): { headline: string; narrative: string; keyQuestions: string[] } {

  const risk = riskContent[riskCategory];
  const arch = archetypeContent[archetype];
  const post = postureContent[posture];

  // 1. Generate Headline
  const headline = `${riskCategory} via ${archetype} Architecture with ${posture} Governance`;

  // 2. Generate Narrative
  const narrative = `${risk.narrative} ${arch.narrative} The primary OWASP risks in play are ${risk.asi.join(" and ")}. ${post.narrative}`;

  // 3. Generate Key Questions
  const keyQuestions = [
    `How does the ${archetype} architecture handle a ${riskCategory} event under ${posture} governance?`,
    `Which specific NIST 800-53 controls fail first when ${risk.asi[0]} is exploited in this configuration?`,
    `What is the blast radius of a ${riskCategory} failure within a ${archetype} system with ${posture} controls?`,
  ];

  return { headline, narrative, keyQuestions };
}
