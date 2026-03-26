
/**
 * @file scrambler-generator.ts
 * @description Generates random but realistic FactPatterns for the Agentic AI Security Scrambler.
 * This module contains the logic for creating scenarios based on weighted probabilities derived
 * from the IMDA framework and pedagogical requirements.
 */

import type {
  FactPattern,
  ConstraintRule,
  GovernancePosture,
} from './scrambler-types';

// Extracted sub-types from FactPattern (they are inline in scrambler-types.ts)
type ImpactProfile = FactPattern['impact_profile'];
type LikelihoodProfile = FactPattern['likelihood_profile'];
type ControlState = FactPattern['control_state'];

// ─── GENERATOR_WEIGHTS ──────────────────────────────────────────────
/**
 * Probability distributions for all 13 FactPattern dimensions.
 * Used by the FactPattern generator to produce IMDA-informed scenarios.
 *
 * @remarks
 * Derivation: IMDA framework emphasis + pedagogical balance.
 * Concepts discussed at greater length receive higher probability.
 * All dimensions are independently sampled.
 * Decision Point: DP-05 (confidence 0.85)
 */
export const GENERATOR_WEIGHTS = {
  risk_category: {
    Erroneous: 0.25,
    Unauthorised: 0.25,
    Disruption: 0.20,
    DataBreach: 0.20,
    Biased: 0.10,
  },
  agent_archetype: {
    Single: 0.40,
    Sequential: 0.25,
    Supervisor: 0.20,
    Swarm: 0.15,
  },
  impact_profile: {
    domain_error_tolerance: { Low: 0.40, Medium: 0.35, High: 0.25 },
    data_sensitivity: { PII: 0.30, Confidential: 0.30, TradeSecret: 0.20, Public: 0.20 },
    external_access: { Sandboxed: 0.30, Internal: 0.40, External: 0.30 },
    action_scope: { ReadOnly: 0.35, ReadWrite: 0.65 },
    reversibility: { Reversible: 0.40, Irreversible: 0.60 },
  },
  likelihood_profile: {
    autonomy: { Low: 0.25, Medium: 0.40, High: 0.35 },
    task_complexity: { Simple: 0.25, Complex: 0.45, VeryComplex: 0.30 },
    external_exposure: { None: 0.20, Minimal: 0.40, High: 0.40 },
  },
  control_state: {
    has_agent_limits: 0.60,
    has_identity_management: 0.45,
    has_oversight_design: 0.50,
    has_dev_controls: 0.55,
    has_testing: 0.40,
    has_phased_deployment: 0.35,
    has_monitoring: 0.55,
  },
} as const;

// ─── WEIGHTED RANDOM SELECTION UTILITY ──────────────────────────────
/**
 * Generic utility for sampling from a weighted distribution.
 * Used by the FactPattern generator for all categorical dimensions.
 * @param weights A record mapping string keys to their numeric weights.
 * @returns A randomly selected key based on the provided weights.
 */
export function weightedRandom<T extends string>(
  weights: Record<T, number>
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * total;
  for (const [value, weight] of entries) {
    random -= weight;
    if (random <= 0) return value;
  }
  return entries[entries.length - 1][0]; // Fallback
}

// ─── CONTROL STATE GENERATOR ────────────────────────────────────────
/**
 * Generates the control_state object with booleans determined by weighted probabilities.
 * @returns A ControlState object with each control's status set to true or false.
 */
export function generateControlState(): ControlState {
  const weights = GENERATOR_WEIGHTS.control_state;
  return Object.fromEntries(
    Object.entries(weights).map(([key, pTrue]) => [
      key,
      Math.random() < pTrue,
    ])
  ) as ControlState;
}

// ─── CONSTRAINT_RULES ───────────────────────────────────────────────
/**
 * Rules that eliminate impossible or pedagogically useless combinations.
 * The generator re-rolls any FactPattern that violates a constraint.
 *
 * @remarks
 * Each rule is a predicate function. If it returns true, the FactPattern is invalid.
 * Decision Point: DP-05 (confidence 0.85)
 */
export const CONSTRAINT_RULES: ConstraintRule[] = [
  {
    id: 'CR-01',
    description: 'Single-agent archetype cannot have cascade path',
    predicate: (fp: FactPattern) => false, // Per spec, not a hard constraint as Single + Disruption is valid via ASI02
    source: 'Interface 1: cascade_path is empty for Single archetype',
  },
  {
    id: 'CR-02',
    description: 'Swarm archetype requires at least one control_state boolean to be false',
    predicate: (fp: FactPattern) => {
      if (fp.agent_archetype !== 'Swarm') return false;
      const falseCount = Object.values(fp.control_state).filter(v => !v).length;
      return falseCount < 1; // Swarm with all controls is pedagogically uninteresting
    },
    source: 'DP-07: Swarm scenarios must demonstrate coordination failures',
  },
  {
    id: 'CR-03',
    description: 'Sandboxed external_access cannot have High external_exposure',
    predicate: (fp: FactPattern) =>
      fp.impact_profile.external_access === 'Sandboxed' &&
      fp.likelihood_profile.external_exposure === 'High',
    source: 'Logical contradiction: sandboxed agents cannot have high external exposure',
  },
  {
    id: 'CR-04',
    description: 'ReadOnly action_scope with Disruption risk category is a soft constraint',
    predicate: (fp: FactPattern) => false, // Per spec, soft constraint, allow but flag for review
    source: 'Pedagogical clarity: ReadOnly + Disruption is counterintuitive without cascade context',
  },
  {
    id: 'CR-05',
    description: 'All 7 control_state booleans cannot be true simultaneously',
    predicate: (fp: FactPattern) => {
      return Object.values(fp.control_state).every(v => v === true);
    },
    source: 'Pedagogical requirement: at least one control must be absent to demonstrate breakage',
  },
  {
    id: 'CR-06',
    description: 'All 7 control_state booleans cannot be false simultaneously',
    predicate: (fp: FactPattern) => {
      return Object.values(fp.control_state).every(v => v === false);
    },
    source: 'Pedagogical requirement: at least one control must be present to demonstrate effectiveness',
  },
  {
    id: 'CR-07',
    description: 'Biased risk category with Low autonomy and Simple task is pedagogically weak',
    predicate: (fp: FactPattern) =>
      fp.risk_category === 'Biased' &&
      fp.likelihood_profile.autonomy === 'Low' &&
      fp.likelihood_profile.task_complexity === 'Simple',
    source: 'Pedagogical clarity: bias scenarios require sufficient agent autonomy and task complexity',
  },
  {
    id: 'CR-08',
    description: 'Supervisor archetype must have has_oversight_design as one of the booleans being evaluated',
    predicate: (fp: FactPattern) => false, // Per spec, not a hard constraint
    source: 'DP-09: Supervisor archetype is the primary vehicle for oversight design teaching',
  },
  {
    id: 'CR-09',
    description: 'DataBreach risk category with Public data_sensitivity is pedagogically weak',
    predicate: (fp: FactPattern) =>
      fp.risk_category === 'DataBreach' &&
      fp.impact_profile.data_sensitivity === 'Public',
    source: 'Pedagogical clarity: data breach of public data is not a meaningful failure scenario',
  },
  {
    id: 'CR-10',
    description: 'Maximum re-roll limit to prevent infinite loops',
    predicate: () => false, // Meta-constraint implemented in generator logic
    source: 'Implementation safeguard: generator attempts max 50 re-rolls',
  },
];

/**
 * Generates a complete, valid FactPattern by randomly selecting values based on weights and enforcing constraints.
 * The function will attempt to generate a valid pattern up to 50 times before throwing an error.
 * @returns A promise that resolves to a valid FactPattern.
 */
export function generateFactPattern(): FactPattern {
  const MAX_REROLLS = 50;
  for (let i = 0; i < MAX_REROLLS; i++) {
    const impact_profile: ImpactProfile = {
      domain_error_tolerance: weightedRandom(GENERATOR_WEIGHTS.impact_profile.domain_error_tolerance),
      data_sensitivity: weightedRandom(GENERATOR_WEIGHTS.impact_profile.data_sensitivity),
      external_access: weightedRandom(GENERATOR_WEIGHTS.impact_profile.external_access),
      action_scope: weightedRandom(GENERATOR_WEIGHTS.impact_profile.action_scope),
      reversibility: weightedRandom(GENERATOR_WEIGHTS.impact_profile.reversibility),
    };

    const likelihood_profile: LikelihoodProfile = {
      autonomy: weightedRandom(GENERATOR_WEIGHTS.likelihood_profile.autonomy),
      task_complexity: weightedRandom(GENERATOR_WEIGHTS.likelihood_profile.task_complexity),
      external_exposure: weightedRandom(GENERATOR_WEIGHTS.likelihood_profile.external_exposure),
    };

    const factPattern: FactPattern = {
      risk_category: weightedRandom(GENERATOR_WEIGHTS.risk_category),
      agent_archetype: weightedRandom(GENERATOR_WEIGHTS.agent_archetype),
      impact_profile,
      likelihood_profile,
      control_state: generateControlState(),
    };

    const isInvalid = CONSTRAINT_RULES.some(rule => rule.predicate(factPattern));

    if (!isInvalid) {
      return factPattern;
    }
  }

  throw new Error(`Failed to generate a valid FactPattern after ${MAX_REROLLS} attempts.`);
}

/**
 * Generates a FactPattern for Guided Mode based on a specified risk category, archetype, and governance posture.
 * The posture determines the number of active security controls.
 * @param riskCategory The IMDA risk category for the scenario.
 * @param archetype The agent archetype for the scenario.
 * @param posture The governance posture, which determines control state density.
 * @returns A valid FactPattern conforming to the preset inputs.
 */
export function generateFromPreset(
  riskCategory: FactPattern['risk_category'],
  archetype: FactPattern['agent_archetype'],
  posture: GovernancePosture
): FactPattern {
  const MAX_REROLLS = 50;
  const postureToTrueCount: Record<GovernancePosture, number> = {
    Minimal: 2,
    Standard: 4,
    Full: 6,
  };
  const numTrueControls = postureToTrueCount[posture];

  for (let i = 0; i < MAX_REROLLS; i++) {
    const impact_profile: ImpactProfile = {
      domain_error_tolerance: weightedRandom(GENERATOR_WEIGHTS.impact_profile.domain_error_tolerance),
      data_sensitivity: weightedRandom(GENERATOR_WEIGHTS.impact_profile.data_sensitivity),
      external_access: weightedRandom(GENERATOR_WEIGHTS.impact_profile.external_access),
      action_scope: weightedRandom(GENERATOR_WEIGHTS.impact_profile.action_scope),
      reversibility: weightedRandom(GENERATOR_WEIGHTS.impact_profile.reversibility),
    };

    const likelihood_profile: LikelihoodProfile = {
      autonomy: weightedRandom(GENERATOR_WEIGHTS.likelihood_profile.autonomy),
      task_complexity: weightedRandom(GENERATOR_WEIGHTS.likelihood_profile.task_complexity),
      external_exposure: weightedRandom(GENERATOR_WEIGHTS.likelihood_profile.external_exposure),
    };

    const controlKeys = Object.keys(GENERATOR_WEIGHTS.control_state) as (keyof ControlState)[];
    controlKeys.sort(() => Math.random() - 0.5); // Shuffle keys
    const control_state = Object.fromEntries(
        controlKeys.map((key, index) => [key, index < numTrueControls])
    ) as ControlState;

    const factPattern: FactPattern = {
      risk_category: riskCategory,
      agent_archetype: archetype,
      impact_profile,
      likelihood_profile,
      control_state,
    };

    const isInvalid = CONSTRAINT_RULES.some(rule => rule.predicate(factPattern));

    if (!isInvalid) {
      return factPattern;
    }
  }
  throw new Error(`Failed to generate a valid preset FactPattern after ${MAX_REROLLS} attempts.`);
}
