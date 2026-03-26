/**
 * @file scrambler-info-content.ts
 * @description Provides educational content for the AI Security Scrambler's interactive cards.
 * This constant object, CARD_INFO, maps each selectable card in the Scenario Simulator
 * to its corresponding title, description, real-world examples, and related OWASP Agentic AI risks.
 */

export const CARD_INFO: Record<string, { title: string; description: string; examples: string[]; relatedASI: string[] }> = {
  // Risk Categories
  Erroneous: {
    title: 'Erroneous Outputs',
    description: 'Agents produce incorrect, fabricated, or nonsensical information, leading to flawed decision-making. This stems from issues like model hallucination, where the LLM generates plausible but false content, or from processing corrupted data, causing outputs that deviate from user intent or factual reality.',
    examples: [
      'Hallucinated legal citations in a contract review agent',
      'An AI travel assistant booking a flight to the wrong city based on an ambiguous query',
      'A medical diagnostic agent misinterpreting patient data and providing a wrong diagnosis.'
    ],
    relatedASI: ['ASI01', 'ASI06']
  },
  Unauthorised: {
    title: 'Unauthorised Actions',
    description: 'The agent performs actions that exceed its explicit permissions or violate operational constraints. This can occur when an agent misinterprets ambiguous goals, is manipulated through prompt injection, or escalates its privileges to access sensitive systems or execute unintended functions.',
    examples: [
      'A personal finance agent transferring funds without user confirmation',
      'A social media agent posting offensive content after being tricked by a malicious user prompt',
      'An IT administration agent deleting critical files instead of archiving them.'
    ],
    relatedASI: ['ASI01', 'ASI02', 'ASI03']
  },
  Biased: {
    title: 'Biased Outcomes',
    description: 'The agent exhibits systematic prejudice in its outputs, reinforcing societal biases present in its training data. This can lead to unfair, discriminatory, or inequitable results, particularly in sensitive applications like hiring, loan applications, or criminal justice.',
    examples: [
      'A hiring agent consistently favoring candidates from a specific demographic',
      'A loan-decisioning agent offering worse terms to applicants from certain neighborhoods',
      'A content moderation agent that is more likely to flag content from minority groups.'
    ],
    relatedASI: ['ASI01', 'ASI09']
  },
  DataBreach: {
    title: 'Data Breach and Exfiltration',
    description: 'Sensitive, confidential, or private data is improperly disclosed by the agent. This can happen through direct exfiltration attacks, where an attacker tricks the agent into revealing information, or indirectly, when the agent inadvertently includes private data in its responses or logs.',
    examples: [
      'EchoLeak zero-click exfiltration via M365 Copilot',
      'An agent leaking proprietary source code in a public forum while answering a programming question',
      'A customer service chatbot revealing a user\'s personal identifiable information (PII).'
    ],
    relatedASI: ['ASI03', 'ASI06']
  },
  Disruption: {
    title: 'Service Disruption',
    description: 'The agent\'s actions lead to the degradation or denial of service for critical systems. This can be caused by resource exhaustion from cascading agent failures, infinite loops triggered by unexpected inputs, or the agent taking down essential infrastructure based on a flawed interpretation of its goals.',
    examples: [
      'An automated scaling agent misinterpreting a traffic spike and shutting down production servers',
      'A swarm of agents overwhelming an internal API with recursive calls, causing a denial of service',
      'A code generation agent creating an infinite loop that consumes all available CPU resources.'
    ],
    relatedASI: ['ASI05', 'ASI08']
  },

  // Agent Archetypes
  Single: {
    title: 'Single Agent',
    description: 'A monolithic architecture where one agent, often with a single LLM brain, handles all tasks. While simple to implement, it creates a single point of failure and can struggle with complex, multi-step problems that require diverse capabilities or strict separation of duties.',
    examples: [
      'A simple chatbot that answers customer questions from a knowledge base',
      'A code generation assistant that writes functions based on a user prompt',
      'A personal email assistant that summarizes incoming messages.'
    ],
    relatedASI: ['ASI01', 'ASI02', 'ASI09']
  },
  Sequential: {
    title: 'Sequential Agents',
    description: 'A pipeline architecture where multiple specialized agents operate in a sequence, with the output of one agent becoming the input for the next. This pattern allows for task decomposition but can be brittle; an error in one agent impacts the entire chain.',
    examples: [
      'A research pipeline where one agent finds sources, a second summarizes them, and a third drafts a report',
      'A software development workflow with a planning agent, a coding agent, and a testing agent',
      'An image processing chain where one agent resizes, another applies a filter, and a third adds a watermark.'
    ],
    relatedASI: ['ASI08', 'ASI04']
  },
  Supervisor: {
    title: 'Supervisor-Subordinate Agents',
    description: 'A hierarchical architecture where a supervisor agent decomposes tasks and delegates them to specialized subordinate agents. The supervisor orchestrates the workflow and integrates the results, providing better control and oversight than simpler models.',
    examples: [
      'A project management system where a supervisor agent assigns tasks to developer and QA agents',
      'An autonomous sales team with a lead-generation agent, a communication agent, and a closing agent, all managed by a supervisor',
      'A complex data analysis task where a supervisor dispatches sub-queries to different data-retrieval agents.'
    ],
    relatedASI: ['ASI07', 'ASI10']
  },
  Swarm: {
    title: 'Agent Swarm',
    description: 'A decentralized architecture where a large number of independent or semi-independent agents collaborate to solve a problem. This model is resilient and powerful but introduces significant risks related to emergent behavior, communication security, and cascading failures.',
    examples: [
      'A distributed denial-of-service attack conducted by a botnet of compromised agents',
      'A financial market analysis system where thousands of agents monitor different assets and collectively predict trends',
      'A scientific discovery platform where a swarm of agents explores a vast parameter space for a simulation.'
    ],
    relatedASI: ['ASI08', 'ASI07', 'ASI10']
  },

  // Governance Postures
  Minimal: {
    title: 'Minimal Governance',
    description: 'A security posture with significant gaps, where 5-6 key NIST 800-53 control families are not implemented. This represents a high-risk environment with minimal oversight, weak access controls, and a lack of monitoring, making it highly vulnerable to a wide range of attacks.',
    examples: [
      'A startup deploying a customer-facing agent with no formal security review or logging',
      'An internal tool built by a developer without involving the security team',
      'An open-source agentic framework deployed with default, insecure configurations.'
    ],
    relatedASI: ['ASI01', 'ASI02', 'ASI03', 'ASI05', 'ASI09', 'ASI10']
  },
  Standard: {
    title: 'Standard Governance',
    description: 'A baseline security posture with 2-3 missing NIST 800-53 control families. While many foundational controls are in place, critical gaps remain in areas like incident response, continuous monitoring, or supply chain security, leaving the system exposed to sophisticated threats.',
    examples: [
      'A company with strong development controls but no dedicated incident response plan for agentic systems',
      'An organization that authenticates users but fails to monitor for anomalous agent behavior',
      'A well-tested agent that relies on a vulnerable, unvetted third-party tool.'
    ],
    relatedASI: ['ASI04', 'ASI08', 'ASI10']
  },
  Full: {
    title: 'Full Governance',
    description: 'A mature and robust security posture where all relevant NIST 800-53 control families are implemented, with 0-1 minor gaps. This represents a defense-in-depth strategy with strong preventative, detective, and corrective controls tailored to agentic AI risks.',
    examples: [
      'A defense contractor deploying an agent with rigorous identity management, continuous monitoring, and human-in-the-loop oversight',
      'A financial institution with a multi-layered security architecture for its automated trading agents',
      'A healthcare provider using an AI assistant that has undergone extensive testing, phased deployment, and has a comprehensive incident response plan.'
    ],
    relatedASI: []
  }
};
