/**
 * Scenario Simulator Tab — v0.5.0 Remediated
 * 
 * Bug fixes applied:
 * Bug 1: Shared openTooltipId state (no stacking bubbles)
 * Bug 2: stopPropagation on ⓘ icon (no dual-action click)
 * Bug 3: Escape / click-outside / ✕ dismiss for info bubbles
 * Bug 4: Text tokens (--text-primary, --text-secondary, --text-caption)
 * Bug 5: Chart accessibility (12px labels, SVG role/title/desc, grid lines)
 * Bug 6: Single-click select model (ⓘ for info, card body for select)
 * Bug 7: Colorblind-safe heatmap icons (square/✓, diamond/✕, line)
 * Bug 8: 32×32px heatmap cells + ARIA labels
 * Bug 9: Scroll-to-results + pulse + toast on generation
 * Bug 10: Mode context badge on heatmap header
 * Bug 11: Responsive heatmap with sticky row headers
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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

// ─── Toast Utility (Bug 9) ─────────────────────────────────────────

function showToast(message: string, duration = 4000) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

// ─── Colorblind-Safe Heatmap Icons (Bug 7) ─────────────────────────

function ActiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#10B981" opacity="0.3" />
      <path d="M4.5 8.5L7 11L11.5 5.5" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function BrokenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="8" y="1.5" width="9" height="9" rx="1" transform="rotate(45 8 1.5)" fill="#EF4444" opacity="0.3" />
      <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IrrelevantIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <line x1="4" y1="8" x2="12" y2="8" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Info Bubble Component (Bugs 1, 3, 4) ──────────────────────────

function InfoBubble({
  cardKey,
  onClose,
  bubbleRef,
}: {
  cardKey: string;
  onClose: () => void;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
}) {
  const info = CARD_INFO[cardKey];
  if (!info) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 left-0 top-full mt-2"
      ref={bubbleRef}
    >
      <div
        className="rounded-lg p-3 border shadow-xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "#2563EB",
          borderColor: "rgba(255,255,255,0.2)",
          width: 320,
          height: 280,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="flex items-start justify-between mb-2 sticky top-0">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-xs font-bold text-white">{info.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-0.5 rounded hover:bg-blue-600 transition-colors shrink-0"
              aria-label="Close tooltip"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[13px] leading-relaxed mb-3 text-blue-100">
            {info.description}
          </p>
          {info.examples.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1 text-blue-200">
                Real-World Examples
              </div>
              <ul className="space-y-1">
                {info.examples.map((ex, i) => (
                  <li key={i} className="text-[12px] flex items-start gap-1.5 text-blue-100">
                    <span className="text-blue-300 mt-0.5 shrink-0">&#x2022;</span>
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
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white/10 text-white border border-white/20"
                >
                  {asi}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Selectable Card with Info Icon (Bugs 1, 2, 6) ────────────────

function SelectableCard({
  cardKey,
  isSelected,
  accentColor,
  onSelect,
  openTooltipId,
  setOpenTooltipId,
  bubbleRef,
}: {
  cardKey: string;
  isSelected: boolean;
  accentColor: string;
  onSelect: (key: string) => void;
  openTooltipId: string | null;
  setOpenTooltipId: (id: string | null) => void;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isInfoOpen = openTooltipId === cardKey;

  // Bug 6: Card body click = select only (no info bubble)
  const handleCardClick = () => {
    onSelect(cardKey);
  };

  // Bug 2: ⓘ click = info only (stopPropagation prevents card selection)
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInfoOpen) {
      setOpenTooltipId(null);
    } else {
      setOpenTooltipId(cardKey);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCardClick}
        className="px-2.5 py-1.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1"
        style={{
          backgroundColor: isSelected ? `${accentColor}20` : "transparent",
          color: isSelected ? accentColor : "var(--text-secondary, #94A3B8)",
          border: `1.5px solid ${isSelected ? accentColor : "#334155"}`,
        }}
      >
        {cardKey}
        {/* Bug 6: ⓘ icon always visible, separate click target */}
        <span
          onClick={handleInfoClick}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-help"
          role="button"
          aria-label={`More info about ${cardKey}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleInfoClick(e as unknown as React.MouseEvent);
            }
          }}
        >
          <Info className="w-3 h-3" />
        </span>
      </button>
      <AnimatePresence>
        {isInfoOpen && (
          <InfoBubble cardKey={cardKey} onClose={() => setOpenTooltipId(null)} bubbleRef={bubbleRef} />
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
        <span className="text-[11px]" style={{ color: "var(--text-primary, #E2E8F0)" }}>{label}</span>
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

// ─── Bias Chart (Bug 5: Accessible) ────────────────────────────────

function BiasChart({ data, archetype, actionsPerHr }: { data: BiasDataPoint[]; archetype: string; actionsPerHr: number }) {
  if (data.length === 0) return null;
  const maxAction = Math.max(...data.map((d) => d.action));
  const chartWidth = 100;
  const chartHeight = 60;

  const descText = `Line chart showing human oversight accuracy percentage on the Y-axis versus action count on the X-axis. Accuracy starts at ${data[0]?.accuracy ?? 95}% for 1 action, then declines as action count increases. This models the ASI09 (Automation Bias) risk for a ${archetype} processing ${actionsPerHr} actions per hour.`;

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 12}`}
        className="w-full h-28"
        role="img"
        aria-label={`Automation Bias chart: Human oversight accuracy declines as action count increases for ${archetype} at ${actionsPerHr} actions per hour`}
      >
        <title>Automation Bias — Human Oversight Degradation</title>
        <desc>{descText}</desc>
        {/* Bug 5: Faint grid lines */}
        {[95, 82, 65].map((pct) => {
          const y = chartHeight - ((pct - 60) / 40) * chartHeight;
          return (
            <g key={pct}>
              <line
                x1="0" y1={y} x2={chartWidth} y2={y}
                stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.3"
              />
              {/* Bug 5: 12px equivalent in SVG viewbox = ~4 units */}
              <text x="1" y={y - 1.5} fill="var(--text-secondary, #94A3B8)" fontSize="3.5" fontWeight="500">{pct}%</text>
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
            <g key={d.action}>
              <circle
                cx={x} cy={y}
                r={isSpike ? 1.5 : 0.8}
                fill={isSpike ? "#EF4444" : "#F59E0B"}
              />
              {/* Bug 5: Data point labels at key points */}
              {(d.action === 1 || d.action === 12 || d.action === maxAction || d.action === 5) && (
                <>
                  <rect x={x - 4} y={y - 6} width="8" height="4" rx="0.5" fill="rgba(15,23,42,0.85)" />
                  <text x={x} y={y - 3} fill="var(--text-primary, #E2E8F0)" fontSize="2.8" textAnchor="middle" fontWeight="600">
                    {Math.round(d.accuracy)}%
                  </text>
                </>
              )}
            </g>
          );
        })}
        {/* Bug 5: X-axis labels at 12px equivalent */}
        {[1, 5, 10, 15, 20, 25].map((a) => {
          if (a > maxAction) return null;
          const x = (a / maxAction) * (chartWidth - 4) + 2;
          return (
            <text key={a} x={x} y={chartHeight + 5} fill="var(--text-secondary, #94A3B8)" fontSize="3.5" textAnchor="middle" fontWeight="500">
              {a}
            </text>
          );
        })}
        {/* Bug 5: Axis labels */}
        <text x={chartWidth / 2} y={chartHeight + 10} fill="var(--text-secondary, #94A3B8)" fontSize="3" textAnchor="middle">
          Action Count →
        </text>
        <text x="-30" y="3" fill="var(--text-secondary, #94A3B8)" fontSize="2.5" transform={`rotate(-90, 3, ${chartHeight / 2})`} textAnchor="middle">
          Oversight %
        </text>
      </svg>
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
  const [isPulsing, setIsPulsing] = useState(false);

  // Guided mode state
  const [guidedRisk, setGuidedRisk] = useState<string>("Erroneous");
  const [guidedArchetype, setGuidedArchetype] = useState<string>("Single");
  const [guidedPosture, setGuidedPosture] = useState<GovernancePosture>("Standard");

  // Bug 1: Shared tooltip state at parent level
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  // Bug 9: Ref for scroll-to-results
  const resultCardsRef = useRef<HTMLDivElement>(null);

  // Bug 11: Heatmap scroll container ref
  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  // Bug 3: Escape key dismisses tooltip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenTooltipId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Bug 3: Click-outside dismisses tooltip
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openTooltipId && bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        // Also check if click was on an info icon (don't close if clicking another ⓘ)
        const target = e.target as HTMLElement;
        const isInfoIcon = target.closest('[aria-label^="More info"]');
        if (!isInfoIcon) {
          setOpenTooltipId(null);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openTooltipId]);

  // Bug 11: Detect heatmap overflow for scroll fade
  useEffect(() => {
    const el = heatmapScrollRef.current;
    if (!el) return;
    const checkOverflow = () => {
      if (el.scrollWidth > el.clientWidth) {
        el.classList.add('has-overflow');
      } else {
        el.classList.remove('has-overflow');
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [scenario]);

  // Step 3: Scenario Preview
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
    const newCount = scenarioCount + 1;
    setScenarioCount(newCount);

    // Bug 9: Pulse animation
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 700);

    // Bug 9: Scroll to results (first gen always, subsequent only if near top)
    requestAnimationFrame(() => {
      const isNearTop = window.scrollY < 400;
      if (isNearTop || newCount === 1) {
        resultCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Bug 9: Toast notification
    const modeLabel = mode === "guided"
      ? `Guided: ${fp.risk_category} × ${fp.agent_archetype} × ${guidedPosture}`
      : "Random";
    showToast(`Scenario #${newCount} generated — ${fp.risk_category} × ${fp.agent_archetype} [${modeLabel}]`);
  }, [mode, guidedRisk, guidedArchetype, guidedPosture, scenarioCount]);

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
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
            Generate fact patterns and observe how control gaps create security
            breakages across the OWASP-NIST crosswalk.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md overflow-hidden border border-slate-700">
            {(["random", "guided"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setOpenTooltipId(null); }}
                className="px-3 py-1.5 text-[11px] font-semibold transition-all"
                style={{
                  backgroundColor:
                    mode === m ? "rgba(245,158,11,0.15)" : "transparent",
                  color: mode === m ? "#F59E0B" : "var(--text-secondary, #94A3B8)",
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
              <span className="text-[10px] ml-1" style={{ color: "var(--text-caption, #64748B)" }}>
                #{scenarioCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Guided Mode Controls (Bug 6: Single-click select model) ─── */}
      <AnimatePresence>
        {mode === "guided" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
              {/* Bug 6: Updated instruction text */}
              <div className="text-[13px] mb-3 flex items-center gap-1.5" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                <Info className="w-3.5 h-3.5 shrink-0" />
                Select one option per column. Click <Info className="w-3 h-3 inline mx-0.5" /> for details.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Risk Category */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold mb-2 block" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
                        openTooltipId={openTooltipId}
                        setOpenTooltipId={setOpenTooltipId}
                        bubbleRef={bubbleRef}
                      />
                    ))}
                  </div>
                </div>
                {/* Agent Archetype */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold mb-2 block" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
                        openTooltipId={openTooltipId}
                        setOpenTooltipId={setOpenTooltipId}
                        bubbleRef={bubbleRef}
                      />
                    ))}
                  </div>
                </div>
                {/* Governance Posture */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold mb-2 block" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
                          openTooltipId={openTooltipId}
                          setOpenTooltipId={setOpenTooltipId}
                          bubbleRef={bubbleRef}
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
                  <div className="text-xs font-bold mb-2" style={{ color: "var(--text-primary, #E2E8F0)" }}>
                    {scenarioPreview.headline}
                  </div>
                  <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                    {scenarioPreview.narrative}
                  </p>
                  <div className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: "var(--text-caption, #64748B)" }}>
                    Key Questions This Scenario Will Answer
                  </div>
                  <ul className="space-y-1">
                    {scenarioPreview.keyQuestions.map((q, i) => (
                      <li
                        key={i}
                        className="text-[11px] flex items-start gap-1.5"
                        style={{ color: "var(--text-secondary, #94A3B8)" }}
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
        <div className="text-center py-20" style={{ color: "var(--text-secondary, #94A3B8)" }}>
          <Target className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-caption, #64748B)" }} />
          <div className="text-sm font-medium mb-2">No scenario generated yet</div>
          <div className="text-xs max-w-md mx-auto" style={{ color: "var(--text-caption, #64748B)" }}>
            {mode === "guided"
              ? 'Select your parameters above, then click "Generate Scenario" to run the simulation. Click ⓘ on any card for details.'
              : 'Click "Generate Scenario" to create a randomized fact pattern. The simulator will evaluate which NIST 800-53 controls break under the generated conditions.'}
          </div>
        </div>
      )}

      {/* ─── Scenario Results ─── */}
      {scenario && result && stats && (
        <motion.div
          key={scenarioCount}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Bug 9: Summary Cards with pulse + scroll ref */}
          <div ref={resultCardsRef} className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 ${isPulsing ? 'card-pulse' : ''}`}>
            <div
              className="rounded-lg p-3 border"
              style={{
                borderColor: `${RISK_COLORS[scenario.risk_category]}30`,
                backgroundColor: `${RISK_COLORS[scenario.risk_category]}08`,
              }}
            >
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                Risk Category
              </div>
              <div
                className="text-sm font-bold"
                style={{ color: RISK_COLORS[scenario.risk_category] }}
              >
                {scenario.risk_category}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                {implicatedRisks.length} ASI risks implicated
              </div>
            </div>
            <div className="rounded-lg p-3 border border-amber-500/20 bg-amber-500/5">
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                Archetype
              </div>
              <div className="text-sm font-bold text-amber-400">
                {ARCHETYPE_LABELS[scenario.agent_archetype]}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                {oversightLoad} actions/hr load
                {capacityExceeded && (
                  <span className="text-red-400 ml-1">
                    &#x26A0; Capacity exceeded
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg p-3 border border-red-500/20 bg-red-500/5">
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                Broken Controls
              </div>
              <div className="text-sm font-bold text-red-400">{stats.broken}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                {stats.brokenFamilies.length} families affected
              </div>
            </div>
            <div className="rounded-lg p-3 border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                Active Controls
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {stats.active}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
              <div className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                {result.outcome}
                {/* Bug 10: Mode badge in outcome */}
                <span
                  className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: mode === "guided" ? "rgba(59,130,246,0.15)" : "rgba(100,116,139,0.15)",
                    color: mode === "guided" ? "#93C5FD" : "var(--text-secondary, #94A3B8)",
                  }}
                >
                  {mode === "guided"
                    ? `Guided: ${scenario.risk_category} × ${scenario.agent_archetype} × ${guidedPosture}`
                    : "Random"}
                </span>
              </div>
            </div>
          </div>

          {/* Two-column: Heatmap + Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Dynamic Heatmap */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Dynamic Heatmap — {scenario.risk_category} Scenario
                  {/* Bug 10: Mode badge */}
                  <span
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      backgroundColor: mode === "guided" ? "rgba(30,58,138,0.5)" : "rgba(51,65,85,0.5)",
                      color: mode === "guided" ? "#93C5FD" : "var(--text-secondary, #94A3B8)",
                    }}
                  >
                    {mode === "guided"
                      ? `Guided: ${scenario.risk_category} × ${scenario.agent_archetype} × ${guidedPosture}`
                      : "Random"}
                  </span>
                </h3>
                <div className="flex items-center gap-3">
                  {(["active", "broken", "irrelevant"] as const).map(
                    (state) => (
                      <div key={state} className="flex items-center gap-1.5">
                        {state === "active" && <ActiveIcon />}
                        {state === "broken" && <BrokenIcon />}
                        {state === "irrelevant" && <IrrelevantIcon />}
                        <span className="text-[10px]" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                          {CELL_COLORS[state].label}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Bug 11: Responsive scroll hint on mobile */}
              <div className="text-[11px] mb-2 hidden max-[768px]:block" style={{ color: "var(--text-caption, #64748B)" }}>
                Scroll horizontally to see all control families →
              </div>

              {/* Bug 11: Responsive heatmap container */}
              <div ref={heatmapScrollRef} className="heatmap-scroll-container">
                <table
                  className="w-full border-collapse"
                  style={{ fontSize: 11 }}
                  role="table"
                  aria-label="Dynamic scenario heatmap showing control status per ASI risk and NIST family"
                >
                  <thead>
                    <tr>
                      <th
                        className="text-left text-[11px] font-medium p-1.5 sticky left-0 z-10"
                        style={{ color: "var(--text-secondary, #94A3B8)", backgroundColor: "#0a0e1a", minWidth: 64 }}
                        scope="col"
                      >
                        ASI Risk
                      </th>
                      {NIST_800_53.map((fam) => (
                        <th
                          key={fam.id}
                          className="text-center p-1"
                          style={{ minWidth: 36 }}
                          title={FAMILY_FULL_NAMES[fam.id] || fam.id}
                          scope="col"
                        >
                          {/* Bug 8: Column header at 12px */}
                          <span
                            className="text-[12px] font-bold"
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
                          className="p-1.5 text-[11px] font-bold sticky left-0 z-10 whitespace-nowrap"
                          style={{ color: "var(--text-primary, #E2E8F0)", fontFamily: "var(--font-mono)", backgroundColor: "#0a0e1a" }}
                          scope="row"
                        >
                          {row.asiId}
                        </td>
                        {row.cells.map((cell) => {
                          const colors = CELL_COLORS[cell.state];
                          return (
                            <td
                              key={cell.familyId}
                              className="p-0.5 text-center"
                              aria-label={`${row.asiId} × ${cell.familyId}: ${colors.label}`}
                            >
                              {/* Bug 8: 32×32px cells */}
                              <div
                                className="flex items-center justify-center transition-all duration-200 rounded-sm"
                                style={{
                                  width: 32,
                                  height: 32,
                                  backgroundColor: colors.bg,
                                  border: `1px solid ${colors.border}40`,
                                  margin: "0 auto",
                                }}
                                title={`${row.asiId} × ${cell.familyId} (${FAMILY_FULL_NAMES[cell.familyId] || cell.familyId}): ${colors.label}`}
                              >
                                {/* Bug 7: Shape-coded icons */}
                                {cell.state === "active" && <ActiveIcon />}
                                {cell.state === "broken" && <BrokenIcon />}
                                {cell.state === "irrelevant" && <IrrelevantIcon />}
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
              <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3" style={{ color: "var(--text-primary, #E2E8F0)" }}>
                <Shield className="w-3.5 h-3.5" style={{ color: "var(--text-secondary, #94A3B8)" }} />
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
                <h4 className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                  Impact Profile
                </h4>
                <div className="space-y-1 text-[11px]">
                  {Object.entries(scenario.impact_profile).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span style={{ color: "var(--text-secondary, #94A3B8)" }}>
                        {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="font-mono" style={{ color: "var(--text-primary, #E2E8F0)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <h4 className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                  Likelihood Profile
                </h4>
                <div className="space-y-1 text-[11px]">
                  {Object.entries(scenario.likelihood_profile).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span style={{ color: "var(--text-secondary, #94A3B8)" }}>
                        {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="font-mono" style={{ color: "var(--text-primary, #E2E8F0)" }}>{v}</span>
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
                      <div className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
                              <span className="text-[12px] font-bold text-red-400 font-mono">
                                {section.familyId}
                              </span>
                              <span className="text-[12px]" style={{ color: "var(--text-primary, #E2E8F0)" }}>
                                — {section.familyFullName}
                              </span>
                            </div>
                            <p className="text-[12px] leading-relaxed mb-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                              {section.consequence}
                            </p>
                            <p className="text-[13px] italic" style={{ color: "var(--text-caption, #64748B)" }}>
                              {section.explanation}
                            </p>
                          </div>
                        ))}

                      {narrative.sections.filter((s) => s.status === "active")
                        .length > 0 && (
                        <>
                          <div className="text-[11px] uppercase tracking-wider font-bold mb-3 mt-4" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
                                  <span className="text-[12px] font-bold text-emerald-400 font-mono">
                                    {section.familyId}
                                  </span>
                                  <span className="text-[12px]" style={{ color: "var(--text-primary, #E2E8F0)" }}>
                                    — {section.familyFullName}
                                  </span>
                                </div>
                                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
                      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--text-secondary, #94A3B8)" }}>
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
                            <span className="text-[12px] font-bold font-mono" style={{ color: "var(--text-primary, #E2E8F0)" }}>
                              {imp.familyId}
                            </span>
                            <span className="text-[12px]" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                              — {imp.familyFullName}
                            </span>
                            {imp.wasBroken && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                Was Broken
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] text-red-400/70 uppercase tracking-wider font-bold mb-1">
                                Before (Current Posture)
                              </div>
                              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                                {imp.beforeState}
                              </p>
                            </div>
                            <div>
                              <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-bold mb-1">
                                After (Full Governance)
                              </div>
                              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                                {imp.afterState}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-700/30">
                            <div className="text-[10px] text-amber-400/70 uppercase tracking-wider font-bold mb-1">
                              What Changes
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                              {imp.whatChanges}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4 p-3 rounded-md bg-slate-800/50 border border-slate-700/50">
                        <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                          Overall Verdict
                        </div>
                        <p className="text-[12px] leading-relaxed italic" style={{ color: "var(--text-primary, #E2E8F0)" }}>
                          {contrast.overallVerdict}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Automation Bias Curve (Bug 5: Accessible) */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                Automation Bias — Human Oversight Degradation
              </h3>
              <div className="text-[11px]" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                {ARCHETYPE_LABELS[scenario.agent_archetype]} &middot;{" "}
                {oversightLoad} actions/hr
              </div>
            </div>
            <p className="text-[11px] mb-2" style={{ color: "var(--text-secondary, #94A3B8)" }}>
              As action count increases, human oversight accuracy degrades. The
              spike at action 12 represents a false-confidence recovery before
              accelerated decline. This models ASI09 (Automation Bias) risk.
            </p>
            <BiasChart
              data={biasData}
              archetype={ARCHETYPE_LABELS[scenario.agent_archetype]}
              actionsPerHr={oversightLoad}
            />
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
                          className="text-[12px] font-mono px-3 py-1.5 rounded bg-orange-500/5 border border-orange-500/10"
                          style={{ color: "rgba(253,186,116,0.8)" }}
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
                            <span className="text-[12px] font-bold text-blue-400 font-mono">
                              {risk.asiId} — {asiMeta?.name}
                            </span>
                            <span className="text-[11px]" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                              Weight: {(risk.weight * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary, #94A3B8)" }}>
                            {risk.rationale}
                          </p>
                          <p className="text-[13px] mt-1 italic" style={{ color: "var(--text-caption, #64748B)" }}>
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
