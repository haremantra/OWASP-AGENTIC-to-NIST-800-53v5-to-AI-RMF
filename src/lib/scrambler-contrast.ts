export interface ContrastImprovement {
  familyId: string;
  familyFullName: string;
  wasBroken: boolean;
  beforeState: string;
  afterState: string;
  whatChanges: string;
}

export const FAMILY_FULL_NAMES: Record<string, string> = {
  AC: 'Access Control',
  AU: 'Audit and Accountability',
  CA: 'Assessment Authorization and Monitoring',
  CM: 'Configuration Management',
  CP: 'Contingency Planning',
  IA: 'Identification and Authentication',
  IR: 'Incident Response',
  MP: 'Media Protection',
  PE: 'Physical and Environmental Protection',
  PL: 'Planning',
  PM: 'Program Management',
  RA: 'Risk Assessment',
  SA: 'System and Services Acquisition',
  SC: 'System and Communications Protection',
  SI: 'System and Information Integrity',
  SR: 'Supply Chain Risk Management'
};

const RISK_CATEGORY_TEMPLATES: Record<string, { summary: string; verdict: string; relevantFamilies: string[] }> = {
  Erroneous: {
    summary: 'With full governance, all 7 control booleans are active. The previously broken NIST families are now protected, significantly reducing the likelihood of erroneous agent actions.',
    verdict: 'Even with full governance, complex agent architectures retain inherent unpredictability. The risk is mitigated but not eliminated — continuous monitoring (AU, SI) becomes the critical backstop.',
    relevantFamilies: ['AU', 'SI', 'CA', 'RA', 'PL', 'PM']
  },
  Unauthorised: {
    summary: 'With full governance, all 7 control booleans are active. The previously broken NIST families are now protected, eliminating unauthorized access vectors.',
    verdict: 'Even with full governance, identity spoofing remains a residual threat. The risk is mitigated but not eliminated — strict access control (AC, IA) is essential.',
    relevantFamilies: ['AC', 'IA', 'SC', 'AU', 'IR']
  },
  Biased: {
    summary: 'With full governance, all 7 control booleans are active. The previously broken NIST families are now protected, ensuring fairness and accountability in agent decisions.',
    verdict: 'Even with full governance, subtle biases in training data can manifest. The risk is mitigated but not eliminated — regular assessments (CA, RA) are necessary.',
    relevantFamilies: ['CA', 'RA', 'PL', 'PM', 'AU']
  },
  DataBreach: {
    summary: 'With full governance, all 7 control booleans are active. The previously broken NIST families are now protected, eliminating the data breach attack surface.',
    verdict: 'Even with full governance, insider threats and zero-day vulnerabilities persist. The risk is mitigated but not eliminated — media protection and incident response (MP, IR) are crucial.',
    relevantFamilies: ['AC', 'SC', 'MP', 'IR', 'PE', 'SI']
  },
  Disruption: {
    summary: 'With full governance, all 7 control booleans are active. The previously broken NIST families are now protected, ensuring high availability and resilience against disruption.',
    verdict: 'Even with full governance, swarm architectures retain inherent coordination complexity. The risk is mitigated but not eliminated — contingency planning (CP) becomes the critical backstop.',
    relevantFamilies: ['CP', 'CM', 'SA', 'SR', 'IR']
  }
};

const DEFAULT_TEMPLATE = {
  summary: 'With full governance, all 7 control booleans are active. The previously broken NIST families are now protected, providing a robust defense-in-depth posture.',
  verdict: 'Even with full governance, advanced persistent threats remain a concern. The risk is mitigated but not eliminated — continuous oversight is required.',
  relevantFamilies: ['AC', 'AU', 'CA', 'CM', 'CP', 'IA', 'IR', 'MP', 'PE', 'PL', 'PM', 'RA', 'SA', 'SC', 'SI', 'SR']
};

const FAMILY_IMPROVEMENT_TEMPLATES: Record<string, { before: string; after: string; change: string }> = {
  AC: {
    before: 'Agents operated with excessive privileges and unrestricted access.',
    after: 'Agents operate under strict least-privilege principles.',
    change: 'Access requests are dynamically evaluated against policy, blocking unauthorized actions.'
  },
  AU: {
    before: 'No audit trails existed for agent actions or decisions.',
    after: 'Every agent action is logged with immutable timestamps.',
    change: 'Exfiltration attempts now trigger real-time alerts via monitoring integration.'
  },
  CA: {
    before: 'Agent models were deployed without formal security assessments.',
    after: 'Continuous assessment and authorization processes are enforced.',
    change: 'Vulnerabilities are identified and remediated before agents reach production.'
  },
  CM: {
    before: 'Agent configurations drifted without version control or oversight.',
    after: 'Strict configuration baselines and change management are applied.',
    change: 'Unauthorized modifications to agent prompts or parameters are automatically reverted.'
  },
  CP: {
    before: 'No fallback mechanisms existed for agent failures or disruptions.',
    after: 'Robust contingency plans and failover systems are in place.',
    change: 'System disruptions trigger automatic failover to safe, degraded operational modes.'
  },
  IA: {
    before: 'Agents lacked strong identity verification, allowing spoofing.',
    after: 'Cryptographic identities and multi-factor authentication are required.',
    change: 'Agent-to-agent communications are mutually authenticated, preventing impersonation.'
  },
  IR: {
    before: 'Security incidents involving agents went undetected or unaddressed.',
    after: 'Automated incident response playbooks are actively maintained.',
    change: 'Anomalous agent behavior triggers immediate isolation and forensic data collection.'
  },
  MP: {
    before: 'Sensitive data processed by agents was stored in plaintext.',
    after: 'All media and data at rest are strongly encrypted.',
    change: 'Data exfiltration risks are minimized through strict media handling procedures.'
  },
  PE: {
    before: 'Physical infrastructure hosting agents lacked adequate protection.',
    after: 'Datacenters employ stringent physical access controls and environmental monitoring.',
    change: 'Hardware tampering risks are mitigated through physical security perimeters.'
  },
  PL: {
    before: 'Agent deployments lacked formal security planning and architecture.',
    after: 'Comprehensive security plans guide all agent lifecycle phases.',
    change: 'Security requirements are integrated into the initial design, reducing architectural flaws.'
  },
  PM: {
    before: 'No centralized program existed to manage AI security risks.',
    after: 'A dedicated AI security program oversees all agent deployments.',
    change: 'Governance metrics are continuously tracked and reported to executive leadership.'
  },
  RA: {
    before: 'Risks associated with agentic behavior were not systematically evaluated.',
    after: 'Regular risk assessments identify and prioritize AI-specific threats.',
    change: 'Threat models are updated dynamically based on emerging agent capabilities.'
  },
  SA: {
    before: 'Third-party agent models were acquired without security vetting.',
    after: 'Rigorous security evaluations are required for all AI acquisitions.',
    change: 'Vendor-supplied agents must meet strict security and compliance standards.'
  },
  SC: {
    before: 'Agent communications occurred over unencrypted, untrusted channels.',
    after: 'All system and communication channels are secured and encrypted.',
    change: 'Man-in-the-middle attacks on agent communication are effectively neutralized.'
  },
  SI: {
    before: 'System integrity was not monitored, allowing malicious code execution.',
    after: 'Continuous integrity monitoring and malicious code protection are active.',
    change: 'Unexpected code execution by agents is blocked by runtime integrity checks.'
  },
  SR: {
    before: 'Dependencies and supply chain components for agents were unverified.',
    after: 'Strict supply chain risk management practices are enforced.',
    change: 'Compromised dependencies are detected and blocked before deployment.'
  }
};

export function generateFullGovernanceContrast(
  riskCategory: string,
  archetype: string,
  originalBrokenFamilies: string[],
  originalControlState: Record<string, boolean>
): { summary: string; improvements: ContrastImprovement[]; overallVerdict: string } {
  
  const template = RISK_CATEGORY_TEMPLATES[riskCategory] || DEFAULT_TEMPLATE;
  
  // Determine which families to include: broken ones OR relevant ones
  const familiesToInclude = new Set<string>([...originalBrokenFamilies, ...template.relevantFamilies]);
  
  const improvements: ContrastImprovement[] = [];
  
  for (const familyId of Array.from(familiesToInclude)) {
    if (FAMILY_FULL_NAMES[familyId] && FAMILY_IMPROVEMENT_TEMPLATES[familyId]) {
      const wasBroken = originalBrokenFamilies.includes(familyId);
      const familyTemplate = FAMILY_IMPROVEMENT_TEMPLATES[familyId];
      
      improvements.push({
        familyId,
        familyFullName: FAMILY_FULL_NAMES[familyId],
        wasBroken,
        beforeState: familyTemplate.before,
        afterState: familyTemplate.after,
        whatChanges: familyTemplate.change
      });
    }
  }
  
  // Sort improvements alphabetically by familyId for consistent output
  improvements.sort((a, b) => a.familyId.localeCompare(b.familyId));
  
  // Customize verdict based on archetype if needed
  let finalVerdict = template.verdict;
  if (archetype === 'Swarm' && !finalVerdict.toLowerCase().includes('swarm')) {
    finalVerdict = `Even with full governance, swarm architectures retain inherent coordination complexity. ${finalVerdict}`;
  } else if (archetype === 'Single' && !finalVerdict.toLowerCase().includes('single')) {
    finalVerdict = `Even with full governance, single agent failures can have outsized impacts. ${finalVerdict}`;
  }

  return {
    summary: template.summary,
    improvements,
    overallVerdict: finalVerdict
  };
}
