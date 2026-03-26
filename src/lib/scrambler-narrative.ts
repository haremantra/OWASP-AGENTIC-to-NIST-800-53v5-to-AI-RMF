export interface NarrativeSection {
  familyId: string;
  familyFullName: string;
  status: 'broken' | 'active';
  consequence: string;
  explanation: string;
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

const FAMILY_TO_CONTROL: Record<string, string> = {
  AC: 'has_agent_limits',
  SC: 'has_agent_limits',
  IA: 'has_identity_management',
  PL: 'has_oversight_design',
  PM: 'has_oversight_design',
  CM: 'has_dev_controls',
  SA: 'has_dev_controls',
  SR: 'has_dev_controls',
  MP: 'has_dev_controls',
  PE: 'has_dev_controls',
  CA: 'has_testing',
  RA: 'has_testing',
  CP: 'has_phased_deployment',
  AU: 'has_monitoring',
  IR: 'has_monitoring',
  SI: 'has_monitoring'
};

function getConsequence(
  familyId: string,
  status: 'broken' | 'active',
  riskCategory: string,
  archetype: string
): string {
  const familyName = FAMILY_FULL_NAMES[familyId] || familyId;
  
  if (status === 'active') {
    return `The ${familyName} controls are actively protecting the ${archetype} agent system from ${riskCategory} risks by enforcing necessary boundaries.`;
  }

  if (riskCategory === 'DataBreach') {
    if (familyId === 'AU') return `Without audit trails, the ${archetype} agents data access patterns cannot be traced. If one agent exfiltrates PII, there is no forensic evidence to identify which agent acted, when, or what data was accessed.`;
    if (familyId === 'AC') return `Without access control, the ${archetype} agent can access any data source without restriction. This allows the agent to read and potentially leak sensitive data it should not have access to.`;
    if (familyId === 'SC') return `Without system and communications protection, the ${archetype} agent's data transmissions are exposed. Attackers can intercept sensitive data as it moves between the agent and external services.`;
    return `Without ${familyName}, sensitive information handled by the ${archetype} agent is exposed, increasing the likelihood of a data breach.`;
  }
  
  if (riskCategory === 'Disruption') {
    if (familyId === 'CP') return `Without contingency planning, the ${archetype} agent system has no fallback mechanism. A failure in one component can cause the entire system to halt indefinitely.`;
    if (familyId === 'IR') return `Without incident response, there is no procedure to handle anomalous ${archetype} agent behavior. A runaway agent can cause prolonged disruption before human operators intervene.`;
    return `The lack of ${familyName} leaves the ${archetype} agent vulnerable to disruptions, potentially causing cascading failures or system downtime.`;
  }

  if (riskCategory === 'Erroneous') {
    if (familyId === 'SI') return `Without system and information integrity, the ${archetype} agent may process corrupted inputs. This leads to erroneous outputs that can propagate through downstream systems.`;
    if (familyId === 'CA') return `Without assessment and monitoring, the ${archetype} agent's logic is not continuously validated. The agent may drift from its intended behavior and produce erroneous results.`;
    return `Without ${familyName}, the ${archetype} agent may execute flawed logic unchecked, leading to erroneous outcomes that cannot be easily traced or corrected.`;
  }

  if (riskCategory === 'Unauthorised') {
    if (familyId === 'IA') return `Without identification and authentication, the ${archetype} agent cannot verify the identity of the user or service it interacts with. This allows unauthorized entities to command the agent.`;
    if (familyId === 'AC') return `Without access control, the ${archetype} agent can perform actions beyond its intended scope. It may execute unauthorized commands on behalf of the user.`;
    return `The absence of ${familyName} allows the ${archetype} agent to potentially bypass intended boundaries, performing unauthorized actions without detection.`;
  }

  if (riskCategory === 'Biased') {
    if (familyId === 'PL') return `Without proper planning, the ${archetype} agent's design may lack fairness constraints. This can result in biased decisions that disproportionately affect certain groups.`;
    if (familyId === 'PM') return `Without program management, there is no oversight to ensure the ${archetype} agent's models are trained on diverse data. This leads to inherent bias in the agent's outputs.`;
    return `Lacking ${familyName}, the ${archetype} agent's decisions may be skewed by biased inputs or models, with no mechanism to identify or mitigate the bias.`;
  }

  return `Without ${familyName}, the ${archetype} agent is exposed to ${riskCategory} risks.`;
}

export function generateResultsNarrative(
  riskCategory: string,
  archetype: string,
  brokenFamilies: string[],
  activeFamilies: string[],
  controlState: Record<string, boolean>
): { sections: NarrativeSection[] } {
  const sections: NarrativeSection[] = [];

  for (const familyId of brokenFamilies) {
    const control = FAMILY_TO_CONTROL[familyId];
    sections.push({
      familyId,
      familyFullName: FAMILY_FULL_NAMES[familyId] || familyId,
      status: 'broken',
      consequence: getConsequence(familyId, 'broken', riskCategory, archetype),
      explanation: `The ${control} control is disabled, leaving this family without governance.`
    });
  }

  for (const familyId of activeFamilies) {
    const control = FAMILY_TO_CONTROL[familyId];
    sections.push({
      familyId,
      familyFullName: FAMILY_FULL_NAMES[familyId] || familyId,
      status: 'active',
      consequence: getConsequence(familyId, 'active', riskCategory, archetype),
      explanation: `The ${control} control is enabled, ensuring this family remains active.`
    });
  }

  return { sections };
}
