/**
 * Scenario Simulator Tab — Phase 1 Scrambler UI (5-Step UX)
 * Design: Extends the "Command Center" dark tactical aesthetic
 * 
 * 5-Step User Journey:
 * 1. First click on card → Info bubble with explanation + ✕ close
 * 2. Second click (or click after closing) → Card is selected
 * 3. Scenario Preview → Plain-language explanation of what will be tested
 * 4. Generate Scenario → Results narrative with full NIST names + consequences
 * 5. Full Governance Contrast → Before/after showing what controls fix
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OWASP_ASI,
  NIST_800_53,
} from "@/lib/data";
import { generateFactPattern, generateFromPreset } from "@/lib/scrambler-generator";
import { evaluateScenario, getCellState } from "@/lib/scrambler-evaluator";
import { RISK_TO_ASI, FAMILY_TO_PRIMARY_BOOLEAN } from "@/lib/scrambler-mappings";
import { generateBiasCurve, getOversightLoad, isCapacityExceeded } from "@/lib/scrambler-bias-model";
import { CARD_INFO } from "@/lib/scrambler-info-content";
import { generateScenarioPreview } from "@/lib/scrambler-preview";
import { generateResultsNarrative } from "@/lib/scrambler-narrative";
import { FAMILY_FULL_NAMES as CONTRAST_FAMILY_NAMES, generateFullGovernanceContrast } from "@/lib/scrambler-contrast";
import { FAMILY_FULL_NAMES } from "@/lib/scrambler-narrative";
import type { FactPattern, GovernancePosture } from "@/lib/scrambler-types";
import type { BiasDataPoint } from "@/lib/scrambler-bias-model";
import {
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  ChevronDown,
  ChevronUp,
  Activity,
  Shield,
  Target,
  Gauge,
  Info,
  X,
  Eye,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────

const CELL_COLORS = {
  active: { bg: "#065F46", border: "#10B981", text: "#6EE7B7", label: "Active" },
  broken: { bg: "#7F1D1D", border: "#EF4444", text: "#FCA5A5", label: "Broken" },
  irrelevant: { bg: "#1E293B", border: "#334155", text: "#475569", label: "N/A" },
} as const;

const RISK_COLORS: Record<string, string> = {
  Erroneous: "#F59E0B",
  Unauthorised: "#EF4444",
  Biased: "#A855F7",
  DataBreach: "#3B82F6",
  Disruption: "#F97316",
};

const ARCHETYPE_LABELS: Record<string, string> = {
  Single: "Single Agent",
  Sequential: "Sequential Chain",
  Supervisor: "Supervisor Pattern",
  Swarm: "Swarm Architecture",
};

// ─── Info Bubble Component ──────────────────────────────────────────

function InfoBubble({
  cardKey,
  onClose,
}: {
  cardKey: string;
  onClose: () => void;
}) {
  const info = CARD_INFO[cardKey];
  if (!info) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 left-0 right-0 top-full mt-2"
    >
      <div
        className="rounded-lg p-4 border shadow-xl"
        style={{
          backgroundColor: "#111827",
          borderColor: "#334155",
          maxWidth: 380,
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-slate-200">{info.title}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-0.5 rounded hover:bg-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          {info.description}
        </p>
        {info.examples.length > 0 && (
          <div className="mb-2">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              Real-World Examples
            </div>
            <ul className="space-y-1">
              {info.examples.map((ex, i) => (
                <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5 shrink-0">&#x2022;</span>
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        )}
        {info.relatedASI.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {info.relatedASI.map((asi) => (
              <span
                key={asi}
                className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20"
              >
                {asi}
              </span>
            ))}
          </div>
        )}
        <div className="text-[9px] text-slate-600 mt-3 italic">
          Click the card again to select it.
        </div>
      </div>
    </motion.div>
  );
}

// ─── Selectable Card with Info Bubble ───────────────────────────────

function SelectableCard({
  cardKey,
  isSelected,
  accentColor,
  onSelect,
}: {
  cardKey: string;
  isSelected: boolean;
  accentColor: string;
  onSelect: (key: string) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [hasSeenInfo, setHasSeenInfo] = useState(false);

  const handleClick = () => {
    if (!hasSeenInfo && !isSelected) {
      // First click: show info bubble
      setShowInfo(true);
      setHasSeenInfo(true);
    } else {
      // Second click or already seen: select
      setShowInfo(false);
      onSelect(cardKey);
    }
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="px-2.5 py-1.5 rounded text-[10px] font-semibold transition-all flex items-center gap-1"
        style={{
          backgroundColor: isSelected ? `${accentColor}20` : "transparent",
          color: isSelected ? accentColor : "#64748B",
          border: `1px solid ${isSelected ? `${accentColor}40` : "#334155"}`,
        }}
      >
        {!hasSeenInfo && !isSelected && (
          <Info className="w-3 h-3 opacity-50" />
        )}
        {cardKey}
      </button>
      <AnimatePresence>
        {showInfo && (
          <InfoBubble cardKey={cardKey} onClose={handleCloseInfo} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function ControlToggle({
  label,
  value,
  familyIds,
}: {
  label: string;
  value: boolean;
  familyIds: string[];
}) {
  return (
    <div
      className="flex items-center justify-between py-1.5 px-2 rounded"
      style={{
        backgroundColor: value
          ? "rgba(16,185,129,0.08)"
          : "rgba(239,68,68,0.08)",
      }}
    >
      <div className="flex items-center gap-2">
        {value ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className="text-[11px] text-slate-300">{label}</span>
      </div>
      <div className="flex gap-1">
        {familyIds.map((fam) => (
          <span
            key={fam}
            className="text-[9px] px-1.5 py-0.5 rounded font-mono"
            style={{
              backgroundColor: value
                ? "rgba(16,185,129,0.15)"
                : "rgba(239,68,68,0.15)",
              color: value ? "#6EE7B7" : "#FCA5A5",
            }}
          >
            {fam}
          </span>
        ))}
      </div>
    </div>
  );
}

function BiasChart({ data }: { data: BiasDataPoint[] }) {
  if (data.length === 0) return null;
  const maxAction = Math.max(...data.map((d) => d.action));
  const chartWidth = 100;
  const chartHeight = 60;

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`}
        className="w-full h-24"
      >
        {[95, 82, 65].map((pct) => {
          const y = chartHeight - ((pct - 60) / 40) * chartHeight;
          return (
            <g key={pct}>
              <line
                x1="0" y1={y} x2={chartWidth} y2={y}
                stroke="#334155" strokeWidth="0.3" strokeDasharray="2,2"
              />
              <text x="1" y={y - 1} fill="#64748B" fontSize="3">{pct}%</text>
            </g>
          );
        })}
        <polyline
          fill="none"
          stroke="#F59E0B"
          strokeWidth="0.8"
          points={data
            .map((d) => {
              const x = (d.action / maxAction) * (chartWidth - 4) + 2;
              const y = chartHeight - ((d.accuracy - 60) / 40) * chartHeight;
              return `${x},${y}`;
            })
            .join(" ")}
        />
        {data.map((d) => {
          const x = (d.action / maxAction) * (chartWidth - 4) + 2;
          const y = chartHeight - ((d.accuracy - 60) / 40) * chartHeight;
          const isSpike = d.action === 12;
          return (
            <circle
              key={d.action}
              cx={x} cy={y}
              r={isSpike ? 1.5 : 0.8}
              fill={isSpike ? "#EF4444" : "#F59E0B"}
            />
          );
        })}
        {[1, 5, 10, 15, 20, 25].map((a) => {
          if (a > maxAction) return null;
          const x = (a / maxAction) * (chartWidth - 4) + 2;
          return (
            <text key={a} x={x} y={chartHeight + 8} fill="#64748B" fontSize="3" textAnchor="middle">
              {a}
            </text>
          );
        })}
      </svg>
      <div className="flex justify-between text-[9px] text-slate-500 mt-1 px-1">
        <span>Action Count &rarr;</span>
        <span>Human Oversight Accuracy %</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ScenarioSimulator() {
  const [scenario, setScenario] = useState<FactPattern | null>(null);
  const [result, setResult] = useState<ReturnType<typeof evaluateScenario> | null>(null);
  const [biasData, setBiasData] = useState<BiasDataPoint[]>([]);
  const [mode, setMode] = useState<"random" | "guided">("random");
  const [showDetails, setShowDetails] = useState(false);
  const [showCascade, setShowCascade] = useState(false);
  const [showNarrative, setShowNarrative] = useState(true);
  const [showContrast, setShowContrast] = useState(false);
  const [scenarioCount, setScenarioCount] = useState(0);
  const [scenarioGenerated, setScenarioGenerated] = useState(false);

  // Guided mode state
  const [guidedRisk, setGuidedRisk] = useState<string>("Erroneous");
  const [guidedArchetype, setGuidedArchetype] = useState<string>("Single");
  const [guidedPosture, setGuidedPosture] = useState<GovernancePosture>("Standard");

  // Step 3: Scenario Preview (computed when all 3 guided selections are made)
  const scenarioPreview = useMemo(() => {
    if (mode !== "guided") return null;
    return generateScenarioPreview(guidedRisk, guidedArchetype, guidedPosture);
  }, [mode, guidedRisk, guidedArchetype, guidedPosture]);

  const generateScenarioHandler = useCallback(() => {
    let fp: FactPattern;
    if (mode === "guided") {
      fp = generateFromPreset(
        guidedRisk as FactPattern["risk_category"],
        guidedArchetype as FactPattern["agent_archetype"],
        guidedPosture
      );
    } else {
      fp = generateFactPattern();
    }
    const res = evaluateScenario(fp);
    const bias = generateBiasCurve(25);
    setScenario(fp);
    setResult(res);
    setBiasData(bias);
    setShowDetails(false);
    setShowCascade(false);
    setShowNarrative(true);
    setShowContrast(false);
    setScenarioGenerated(true);
    setScenarioCount((c) => c + 1);
  }, [mode, guidedRisk, guidedArchetype, guidedPosture]);

  // Compute heatmap data
  const heatmapData = useMemo(() => {
    if (!scenario) return null;
    const rows = OWASP_ASI.map((asi) => {
      const cells = NIST_800_53.map((fam) => {
        const state = getCellState(
          asi.id,
          fam.id,
          scenario.control_state,
          scenario.risk_category
        );
        return { familyId: fam.id, state };
      });
      return { asiId: asi.id, asiName: asi.name, cells };
    });
    return rows;
  }, [scenario]);

  // Summary stats
  const stats = useMemo(() => {
    if (!result) return null;
    const broken = result.controls_evaluated.filter((c) => c.state === "broken").length;
    const active = result.controls_evaluated.filter((c) => c.state === "active").length;
    const irrelevant = result.controls_evaluated.filter((c) => c.state === "irrelevant").length;
    const brokenFamilies = Array.from(
      new Set(
        result.controls_evaluated
          .filter((c) => c.state === "broken")
          .map((c) => c.family)
      )
    );
    const activeFamilies = Array.from(
      new Set(
        result.controls_evaluated
          .filter((c) => c.state === "active")
          .map((c) => c.family)
      )
    );
    return { broken, active, irrelevant, brokenFamilies, activeFamilies };
  }, [result]);

  // Step 4: Results Narrative
  const narrative = useMemo(() => {
    if (!scenario || !stats) return null;
    return generateResultsNarrative(
      scenario.risk_category,
      scenario.agent_archetype,
      stats.brokenFamilies,
      stats.activeFamilies,
      scenario.control_state
    );
  }, [scenario, stats]);

  // Step 5: Full Governance Contrast
  const contrast = useMemo(() => {
    if (!scenario || !stats) return null;
    return generateFullGovernanceContrast(
      scenario.risk_category,
      scenario.agent_archetype,
      stats.brokenFamilies,
      scenario.control_state
    );
  }, [scenario, stats]);

  const oversightLoad = scenario
    ? getOversightLoad(scenario.agent_archetype)
    : 0;
  const capacityExceeded = scenario
    ? isCapacityExceeded(scenario.agent_archetype)
    : false;

  const implicatedRisks = useMemo(() => {
    if (!scenario) return [];
    return RISK_TO_ASI[scenario.risk_category] || [];
  }, [scenario]);

  return (
    <div>
      {/* ─── Mode Toggle & Generate Button ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Scenario Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate fact patterns and observe how control gaps create security
            breakages across the OWASP-NIST crosswalk.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md overflow-hidden border border-slate-700">
            {(["random", "guided"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1.5 text-[11px] font-semibold transition-all"
                style={{
                  backgroundColor:
                    mode === m ? "rgba(245,158,11,0.15)" : "transparent",
                  color: mode === m ? "#F59E0B" : "#64748B",
                }}
              >
                {m === "random" ? "Random" : "Guided"}
              </button>
            ))}
          </div>
          <button
            onClick={generateScenarioHandler}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: "rgba(245,158,11,0.15)",
              color: "#F59E0B",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate Scenario
            {scenarioCount > 0 && (
              <span className="text-[10px] text-slate-500 ml-1">
                #{scenarioCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Guided Mode Controls (Steps 1 & 2: Info Bubbles + Selection) ─── */}
      <AnimatePresence>
        {mode === "guided" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <div className="text-[10px] text-slate-500 mb-3 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Click a card once to learn what it means. Click again to select it.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Risk Category */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 block">
                    Risk Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(RISK_COLORS).map((risk) => (
                      <SelectableCard
                        key={risk}
                        cardKey={risk}
                        isSelected={guidedRisk === risk}
                        accentColor={RISK_COLORS[risk]}
                        onSelect={setGuidedRisk}
                      />
                    ))}
                  </div>
                </div>
                {/* Agent Archetype */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 block">
                    Agent Archetype
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ARCHETYPE_LABELS).map((arch) => (
                      <SelectableCard
                        key={arch}
                        cardKey={arch}
                        isSelected={guidedArchetype === arch}
                        accentColor="#F59E0B"
                        onSelect={setGuidedArchetype}
                      />
                    ))}
                  </div>
                </div>
                {/* Governance Posture */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 block">
                    Governance Posture
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["Minimal", "Standard", "Full"] as GovernancePosture[]).map(
                      (p) => (
                        <SelectableCard
                          key={p}
                          cardKey={p}
                          isSelected={guidedPosture === p}
                          accentColor="#10B981"
                          onSelect={(key) =>
                            setGuidedPosture(key as GovernancePosture)
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Step 3: Scenario Preview ─── */}
              {scenarioPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg border border-slate-700/50 bg-slate-900/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-400">
                      Scenario Preview
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 mb-2">
                    {scenarioPreview.headline}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {scenarioPreview.narrative}
                  </p>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                    Key Questions This Scenario Will Answer
                  </div>
                  <ul className="space-y-1">
                    {scenarioPreview.keyQuestions.map((q, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-slate-500 flex items-start gap-1.5"
                      >
                        <ArrowRight className="w-3 h-3 text-amber-500/50 mt-0.5 shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Empty State ─── */}
      {!scenarioGenerated && (
        <div className="text-center py-20 text-slate-500">
          <Target className="w-14 h-14 mx-auto mb-4 text-slate-600" />
          <div className="text-sm font-medium mb-2">No scenario generated yet</div>
          <div className="text-xs text-slate-600 max-w-md mx-auto">
            {mode === "guided"
              ? 'Click the cards above to learn about each option, then select your parameters and click "Generate Scenario" to run the simulation.'
              : 'Click "Generate Scenario" to create a randomized fact pattern. The simulator will evaluate which NIST 800-53 controls break under the generated conditions.'}
          </div>
        </div>
      )}

      {/* ─── Scenario Results (Steps 4 & 5) ─── */}
      {scenario && result && stats && (
        <motion.div
          key={scenarioCount}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div
              className="rounded-lg p-3 border"
              style={{
                borderColor: `${RISK_COLORS[scenario.risk_category]}30`,
                backgroundColor: `${RISK_COLORS[scenario.risk_category]}08`,
              }}
            >
              <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Risk Category
              </div>
              <div
                className="text-sm font-bold"
                style={{ color: RISK_COLORS[scenario.risk_category] }}
              >
                {scenario.risk_category}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {implicatedRisks.length} ASI risks implicated
              </div>
            </div>
            <div className="rounded-lg p-3 border border-amber-500/20 bg-amber-500/5">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Archetype
              </div>
              <div className="text-sm font-bold text-amber-400">
                {ARCHETYPE_LABELS[scenario.agent_archetype]}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {oversightLoad} actions/hr load
                {capacityExceeded && (
                  <span className="text-red-400 ml-1">
                    &#x26A0; Capacity exceeded
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg p-3 border border-red-500/20 bg-red-500/5">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Broken Controls
              </div>
              <div className="text-sm font-bold text-red-400">{stats.broken}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {stats.brokenFamilies.length} families affected
              </div>
            </div>
            <div className="rounded-lg p-3 border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Active Controls
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {stats.active}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {stats.irrelevant} irrelevant
              </div>
            </div>
          </div>

          {/* Outcome Banner */}
          <div
            className="rounded-lg p-4 mb-6 border flex items-start gap-3"
            style={{
              borderColor: result.failure_injected
                ? "rgba(239,68,68,0.3)"
                : "rgba(16,185,129,0.3)",
              backgroundColor: result.failure_injected
                ? "rgba(239,68,68,0.05)"
                : "rgba(16,185,129,0.05)",
            }}
          >
            {result.failure_injected ? (
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            )}
            <div>
              <div
                className="text-xs font-bold mb-1"
                style={{
                  color: result.failure_injected ? "#FCA5A5" : "#6EE7B7",
                }}
              >
                {result.failure_injected
                  ? "SECURITY GAPS DETECTED"
                  : "ALL CONTROLS EFFECTIVE"}
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                {result.outcome}
              </div>
            </div>
          </div>

          {/* Two-column: Heatmap + Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Dynamic Heatmap */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Dynamic Heatmap — {scenario.risk_category} Scenario
                </h3>
                <div className="flex items-center gap-3">
                  {(["active", "broken", "irrelevant"] as const).map(
                    (state) => (
                      <div key={state} className="flex items-center gap-1">
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{
                            backgroundColor: CELL_COLORS[state].bg,
                            border: `1px solid ${CELL_COLORS[state].border}`,
                          }}
                        />
                        <span className="text-[9px] text-slate-500">
                          {CELL_COLORS[state].label}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse"
                  style={{ fontSize: 11 }}
                >
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] text-slate-500 font-medium p-1.5 sticky left-0 bg-[#0a0e1a] z-10">
                        ASI Risk
                      </th>
                      {NIST_800_53.map((fam) => (
                        <th
                          key={fam.id}
                          className="text-center p-1"
                          style={{ minWidth: 32 }}
                          title={FAMILY_FULL_NAMES[fam.id] || fam.id}
                        >
                          <span
                            className="text-[9px] font-bold"
                            style={{
                              color: fam.color,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {fam.id}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData?.map((row) => (
                      <tr
                        key={row.asiId}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td
                          className="p-1.5 text-[10px] font-bold text-slate-300 sticky left-0 bg-[#0a0e1a] z-10 whitespace-nowrap"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {row.asiId}
                        </td>
                        {row.cells.map((cell) => {
                          const colors = CELL_COLORS[cell.state];
                          return (
                            <td
                              key={cell.familyId}
                              className="p-0.5 text-center"
                            >
                              <div
                                className="w-full h-6 rounded-sm flex items-center justify-center transition-all duration-200"
                                style={{
                                  backgroundColor: colors.bg,
                                  border: `1px solid ${colors.border}40`,
                                }}
                                title={`${row.asiId} × ${cell.familyId} (${FAMILY_FULL_NAMES[cell.familyId] || cell.familyId}): ${colors.label}`}
                              >
                                {cell.state === "broken" && (
                                  <XCircle
                                    className="w-3 h-3"
                                    style={{ color: colors.text }}
                                  />
                                )}
                                {cell.state === "active" && (
                                  <CheckCircle2
                                    className="w-3 h-3"
                                    style={{ color: colors.text }}
                                  />
                                )}
                                {cell.state === "irrelevant" && (
                                  <Minus
                                    className="w-2.5 h-2.5"
                                    style={{ color: colors.text }}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Control State Panel */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Control State
              </h3>
              <div className="space-y-1.5">
                {Object.entries(scenario.control_state).map(([key, value]) => {
                  const label = key
                    .replace("has_", "")
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  const families = Object.entries(FAMILY_TO_PRIMARY_BOOLEAN)
                    .filter(([, bool]) => bool === key)
                    .map(([fam]) => fam);
                  return (
                    <ControlToggle
                      key={key}
                      label={label}
                      value={value}
                      familyIds={families}
                    />
                  );
                })}
              </div>

              {/* Impact & Likelihood */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                  Impact Profile
                </h4>
                <div className="space-y-1 text-[10px]">
                  {Object.entries(scenario.impact_profile).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500">
                        {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-slate-300 font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                  Likelihood Profile
                </h4>
                <div className="space-y-1 text-[10px]">
                  {Object.entries(scenario.likelihood_profile).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500">
                        {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-slate-300 font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Step 4: What These Results Mean ─── */}
          {narrative && (
            <div className="mb-6">
              <button
                onClick={() => setShowNarrative(!showNarrative)}
                className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mb-3"
              >
                {showNarrative ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                What These Results Mean
              </button>
              <AnimatePresence>
                {showNarrative && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">
                        Broken Control Families — Why They Matter
                      </div>
                      {narrative.sections
                        .filter((s) => s.status === "broken")
                        .map((section) => (
                          <div
                            key={section.familyId}
                            className="mb-4 last:mb-0 p-3 rounded-md bg-red-500/5 border border-red-500/10"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="text-[11px] font-bold text-red-400 font-mono">
                                {section.familyId}
                              </span>
                              <span className="text-[11px] text-slate-300">
                                — {section.familyFullName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-1">
                              {section.consequence}
                            </p>
                            <p className="text-[10px] text-slate-600 italic">
                              {section.explanation}
                            </p>
                          </div>
                        ))}

                      {narrative.sections.filter((s) => s.status === "active")
                        .length > 0 && (
                        <>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3 mt-4">
                            Active Control Families — What Is Holding
                          </div>
                          {narrative.sections
                            .filter((s) => s.status === "active")
                            .map((section) => (
                              <div
                                key={section.familyId}
                                className="mb-3 last:mb-0 p-3 rounded-md bg-emerald-500/5 border border-emerald-500/10"
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="text-[11px] font-bold text-emerald-400 font-mono">
                                    {section.familyId}
                                  </span>
                                  <span className="text-[11px] text-slate-300">
                                    — {section.familyFullName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {section.consequence}
                                </p>
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ─── Step 5: What Full Governance Looks Like ─── */}
          {contrast && (
            <div className="mb-6">
              <button
                onClick={() => setShowContrast(!showContrast)}
                className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors mb-3"
              >
                {showContrast ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <ShieldCheck className="w-3.5 h-3.5" />
                What Full Governance Looks Like
              </button>
              <AnimatePresence>
                {showContrast && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                        {contrast.summary}
                      </p>

                      {contrast.improvements.map((imp) => (
                        <div
                          key={imp.familyId}
                          className="mb-4 last:mb-0 p-3 rounded-md border"
                          style={{
                            borderColor: imp.wasBroken
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(16,185,129,0.15)",
                            backgroundColor: imp.wasBroken
                              ? "rgba(239,68,68,0.03)"
                              : "rgba(16,185,129,0.03)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-bold font-mono text-slate-300">
                              {imp.familyId}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              — {imp.familyFullName}
                            </span>
                            {imp.wasBroken && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                Was Broken
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-[9px] text-red-400/70 uppercase tracking-wider font-bold mb-1">
                                Before (Current Posture)
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                {imp.beforeState}
                              </p>
                            </div>
                            <div>
                              <div className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-bold mb-1">
                                After (Full Governance)
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                {imp.afterState}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-700/30">
                            <div className="text-[9px] text-amber-400/70 uppercase tracking-wider font-bold mb-1">
                              What Changes
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              {imp.whatChanges}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4 p-3 rounded-md bg-slate-800/50 border border-slate-700/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                          Overall Verdict
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          {contrast.overallVerdict}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Automation Bias Curve */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                Automation Bias — Human Oversight Degradation
              </h3>
              <div className="text-[10px] text-slate-400">
                {ARCHETYPE_LABELS[scenario.agent_archetype]} &middot;{" "}
                {oversightLoad} actions/hr
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-2">
              As action count increases, human oversight accuracy degrades. The
              spike at action 12 represents a false-confidence recovery before
              accelerated decline. This models ASI09 (Automation Bias) risk.
            </p>
            <BiasChart data={biasData} />
          </div>

          {/* Cascade Path */}
          {result.cascade_path.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowCascade(!showCascade)}
                className="flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
              >
                {showCascade ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                Cascade Failure Path ({result.cascade_path.length} paths)
              </button>
              <AnimatePresence>
                {showCascade && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-1.5">
                      {result.cascade_path.map((path, i) => (
                        <div
                          key={i}
                          className="text-[11px] text-orange-300/80 font-mono px-3 py-1.5 rounded bg-orange-500/5 border border-orange-500/10"
                        >
                          {path}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Implicated ASI Risks */}
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Implicated ASI Risks ({implicatedRisks.length})
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {implicatedRisks.map((risk) => {
                      const asiMeta = OWASP_ASI.find(
                        (a) => a.id === risk.asiId
                      );
                      return (
                        <div
                          key={risk.asiId}
                          className="rounded-md p-3 border border-slate-700/50 bg-slate-900/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-blue-400 font-mono">
                              {risk.asiId} — {asiMeta?.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Weight: {(risk.weight * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {risk.rationale}
                          </p>
                          <p className="text-[9px] text-slate-600 mt-1 italic">
                            {risk.imdaRef}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
