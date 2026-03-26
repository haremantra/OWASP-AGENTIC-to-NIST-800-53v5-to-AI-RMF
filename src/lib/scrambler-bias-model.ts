/**
 * @file Defines the bias and cognitive load models for the Agentic AI Security Scrambler.
 */

/**
 * Represents a single data point in the bias/accuracy curve.
 */
export interface BiasDataPoint {
  /** The action number in the sequence. */
  action: number;
  /** The accuracy percentage for this action. */
  accuracy: number;
  /** The cognitive phase associated with this point. */
  phase: string;
}

/**
 * Generates a deterministic bias curve based on the number of actions.
 * The curve models a human operator's declining accuracy under cognitive load.
 * @param actionCount The total number of actions to generate the curve for.
 * @returns An array of BiasDataPoint objects representing the curve.
 */
export function generateBiasCurve(actionCount: number): BiasDataPoint[] {
  const data: BiasDataPoint[] = [];

  for (let i = 1; i <= actionCount; i++) {
    let accuracy: number;
    let phase: string;

    if (i >= 1 && i <= 5) {
      accuracy = 95;
      phase = "Plateau";
    } else if (i >= 6 && i <= 15) {
      // Linear decline from 95% to 82%
      accuracy = 95 - ((i - 5) * (95 - 82)) / 10;
      phase = "Decline";
    } else if (i >= 16 && i <= 25) {
      // Accelerated decline from 82% to 65%
      accuracy = 82 - ((i - 15) * (82 - 65)) / 10;
      phase = "Accelerated Decline";
    } else {
      accuracy = 65;
      phase = "Cognitive Exhaustion";
    }

    // Special case: spike at action 12
    if (i === 12) {
      accuracy = 90;
      phase = "Vigilance Spike";
    }
    
    data.push({ action: i, accuracy: Math.round(accuracy * 100) / 100, phase });
  }

  return data;
}

/**
 * Gets the estimated oversight load in actions per hour for a given agent archetype.
 * @param archetype The agent archetype (e.g., 'Single', 'Sequential', 'Supervisor', 'Swarm').
 * @returns The number of actions per hour.
 */
export function getOversightLoad(archetype: string): number {
  switch (archetype) {
    case 'Single':
      return 20;
    case 'Sequential':
      return 40;
    case 'Supervisor':
      return 60;
    case 'Swarm':
      return 100;
    default:
      return 20; // Default to single agent if archetype is unknown
  }
}

/**
 * Determines if the cognitive capacity for a given archetype is exceeded.
 * @param archetype The agent archetype.
 * @returns True if the oversight load is greater than 50 actions/hour, false otherwise.
 */
export function isCapacityExceeded(archetype: string): boolean {
  return getOversightLoad(archetype) > 50;
}
