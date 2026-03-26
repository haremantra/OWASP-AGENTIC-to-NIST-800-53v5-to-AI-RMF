/*
 * Design: "Command Center" — Military-Grade Intelligence Dashboard
 * Dark tactical interface with information density, strategic color coding
 * Blue (#3B82F6) for NIST 800-53, Emerald (#10B981) for AI-RMF
 * Crimson (#EF4444) for critical severity
 * JetBrains Mono for identifiers, Inter for body text
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OWASP_ASI,
  NIST_800_53,
  AI_RMF,
  CROSSWALK,
  severityColor,
} from "@/lib/data";
import type { ASIRisk } from "@/lib/data";
import { Link } from "wouter";
import {
  Shield,
  Grid3X3,
  Brain,
  Search,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Layers,
  Scale,
  FileText,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ScenarioSimulator from "@/pages/ScenarioSimulator";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663361461713/Bxv8kAWRJNLYA27hMDxSrg/hero-banner-WgxSTgdd9RwHSwF7ESq4Lf.webp";

// ─── Sub-components ──────────────────────────────────────────────

function SeverityBadge({ level }: { level: string }) {
  const isCritical = level === "Critical";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${isCritical ? "pulse-critical" : ""}`}
      style={{
        backgroundColor: `${severityColor[level]}20`,
        color: severityColor[level],
        border: `1px solid ${severityColor[level]}40`,
      }}
    >
      {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {level}
    </span>
  );
}

function MappingCard({
  title,
  items,
  color,
}: {
  title: string;
  items: { id: string; text: string }[];
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-md mb-2 overflow-hidden"
      style={{
        border: `1px solid ${color}25`,
        borderLeft: `3px solid ${color}`,
        backgroundColor: `${color}08`,
      }}
    >
      <div className="px-3 py-2">
        <div className="font-bold text-xs mb-1.5" style={{ color, fontFamily: "var(--font-mono)" }}>
          {title}
        </div>
        {items.map((item, i) => (
          <div key={i} className="text-[11px] leading-relaxed text-slate-300 mb-1">
            {item.id && (
              <span className="font-semibold mr-1" style={{ color, fontFamily: "var(--font-mono)" }}>
                {item.id}
              </span>
            )}
            {item.text}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function HeatCell({ count, max }: { count: number; max: number }) {
  const intensity = max > 0 ? count / max : 0;
  const bg =
    count === 0
      ? "rgba(15,23,42,0.5)"
      : intensity > 0.7
        ? "#1E40AF"
        : intensity > 0.4
          ? "#3B82F6"
          : "#3B82F640";
  const textColor = count === 0 ? "#334155" : intensity > 0.4 ? "white" : "#93C5FD";
  return (
    <td
      className="text-center border border-slate-700/50 transition-all duration-150 hover:brightness-125"
      style={{
        backgroundColor: bg,
        color: textColor,
        padding: "6px 4px",
        fontSize: 11,
        fontWeight: count > 0 ? 700 : 400,
        fontFamily: count > 0 ? "var(--font-mono)" : "inherit",
        minWidth: 36,
      }}
    >
      {count || ""}
    </td>
  );
}

function AIRmfHeatCell({ count, max }: { count: number; max: number }) {
  const intensity = max > 0 ? count / max : 0;
  const bg =
    count === 0
      ? "rgba(15,23,42,0.5)"
      : intensity > 0.7
        ? "#047857"
        : intensity > 0.4
          ? "#10B981"
          : "#10B98140";
  const textColor = count === 0 ? "#334155" : intensity > 0.4 ? "white" : "#6EE7B7";
  return (
    <td
      className="text-center border border-slate-700/50 transition-all duration-150 hover:brightness-125"
      style={{
        backgroundColor: bg,
        color: textColor,
        padding: "8px 6px",
        fontSize: 12,
        fontWeight: count > 0 ? 700 : 400,
        fontFamily: count > 0 ? "var(--font-mono)" : "inherit",
        minWidth: 100,
      }}
    >
      {count || ""}
    </td>
  );
}

function StatCard({ label, value, color, subtitle }: { label: string; value: string | number; color: string; subtitle?: string }) {
  return (
    <div
      className="rounded-md p-3 border"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}30`,
      }}
    >
      <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: `${color}90` }}>
        {label}
      </div>
      <div className="text-xl font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1" style={{ fontSize: 11, color: "#94a3b8" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

type ViewType = "matrix" | "aiRmf" | "detail" | "simulator";

export default function Home() {
  const [selectedASI, setSelectedASI] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("matrix");

  // Compute heatmap data
  const heatmapData = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    let maxVal = 0;
    OWASP_ASI.forEach((asi) => {
      data[asi.id] = {};
      const cw = CROSSWALK[asi.id];
      NIST_800_53.forEach((fam) => {
        const match = cw.nist53.find((n) => n.family === fam.id);
        const count = match ? match.controls.length : 0;
        data[asi.id][fam.id] = count;
        if (count > maxVal) maxVal = count;
      });
    });
    return { data, maxVal };
  }, []);

  const aiRmfHeatmap = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    let maxVal = 0;
    OWASP_ASI.forEach((asi) => {
      data[asi.id] = {};
      const cw = CROSSWALK[asi.id];
      AI_RMF.forEach((func) => {
        const match = cw.aiRmf.find((a) => a.func === func.id);
        const count = match ? match.cats.length : 0;
        data[asi.id][func.id] = count;
        if (count > maxVal) maxVal = count;
      });
    });
    return { data, maxVal };
  }, []);

  // Stats
  const totalControls = useMemo(() => {
    let total = 0;
    Object.values(CROSSWALK).forEach((cw) => {
      cw.nist53.forEach((m) => (total += m.controls.length));
    });
    return total;
  }, []);

  const totalCategories = useMemo(() => {
    let total = 0;
    Object.values(CROSSWALK).forEach((cw) => {
      cw.aiRmf.forEach((m) => (total += m.cats.length));
    });
    return total;
  }, []);

  const uniqueControls = useMemo(() => {
    const ids = new Set<string>();
    Object.values(CROSSWALK).forEach((cw) => {
      cw.nist53.forEach((m) => m.controls.forEach((c) => ids.add(c)));
    });
    return ids.size;
  }, []);

  const uniqueCategories = useMemo(() => {
    const ids = new Set<string>();
    AI_RMF.forEach((func) => func.cats.forEach((c) => ids.add(c)));
    return ids.size;
  }, []);

  const selected = selectedASI ? CROSSWALK[selectedASI] : null;
  const selectedMeta = selectedASI ? OWASP_ASI.find((a) => a.id === selectedASI) : null;

  const tabs: { key: ViewType; label: string; icon: React.ReactNode }[] = [
    { key: "matrix", label: "800-53 Heatmap", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
    { key: "aiRmf", label: "AI-RMF Heatmap", icon: <Brain className="w-3.5 h-3.5" /> },
    { key: "detail", label: "Evidence Explorer", icon: <Search className="w-3.5 h-3.5" /> },
    { key: "simulator", label: "Scenario Simulator", icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero Header ─── */}
      <header
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        <div className="relative container py-8 md:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[3px] text-blue-400/80 font-medium">
                Compliance Middleware
              </div>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
            OWASP Agentic AI <span className="text-blue-400">↔</span> NIST Crosswalk
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Bridging ASI 2026 → NIST 800-53 Rev 5 → NIST AI-RMF 100-1. Interactive compliance mapping
            for agentic AI security risks across {OWASP_ASI.length} threat categories.{" "}
            Severity ratings (Critical, High, Medium-High) are editorially assigned based on OWASP ordinal risk ranking and are not official OWASP severity classifications.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard label="ASI Risks" value={OWASP_ASI.length} color="#3B82F6" />
            <StatCard label="Unique 800-53 Controls" value={uniqueControls} color="#3B82F6" subtitle={`${totalControls} total control mappings across ${OWASP_ASI.length} ASI risks`} />
            <StatCard label="Unique AI-RMF Categories" value={uniqueCategories} color="#10B981" subtitle={`${totalCategories} total category mappings across ${OWASP_ASI.length} ASI risks`} />
            <StatCard label="Critical Risks" value={OWASP_ASI.filter((a) => a.severity === "Critical").length} color="#EF4444" subtitle="ASI01, ASI03, ASI08, ASI10 rated Critical severity" />
          </div>
        </div>
      </header>

      {/* ─── Navigation Tabs ─── */}
      <div className="container">
        <div className="flex gap-0 border-b border-slate-700/50 -mt-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setView(tab.key);
                setSelectedASI(null);
              }}
              className="flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-all duration-150 border-b-2"
              style={{
                color: view === tab.key ? "#3B82F6" : "#64748B",
                backgroundColor: view === tab.key ? "rgba(59,130,246,0.06)" : "transparent",
                borderBottomColor: view === tab.key ? "#3B82F6" : "transparent",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content Area ─── */}
      <main className="container py-6">
        <AnimatePresence mode="wait">
          {/* ─── 800-53 Heatmap View ─── */}
          {view === "matrix" && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-4">
                <h2 className="text-base font-bold text-blue-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  OWASP ASI → NIST 800-53 Rev 5 Control Density
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Each cell shows how many specific 800-53 controls map to that ASI risk. Darker = more controls engaged. Click any row for full detail.
                </p>
                <p className="mt-1" style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                  Scope: 16 of 20 NIST 800-53 Rev 5 control families are represented. Families AT (Awareness & Training), MA (Maintenance), PS (Personnel Security), and PT (PII Transparency) were excluded as lower relevance to agentic AI threat vectors.
                </p>
              </div>
              <TooltipProvider delayDuration={200}>
              <div className="overflow-x-auto rounded-lg border border-slate-700/50 scanline-overlay">
                <table className="w-full border-collapse" style={{ fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th className="text-left p-2 bg-slate-900 text-slate-200 font-semibold sticky left-0 z-10 min-w-[180px]" style={{ fontFamily: "var(--font-sans)" }}>
                        OWASP ASI Risk
                      </th>
                      {NIST_800_53.map((f) => (
                        <th
                          key={f.id}
                          className="bg-slate-900 text-slate-300 font-medium"
                          style={{
                            padding: "6px 2px",
                            fontSize: 9,
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            height: 80,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.5px",
                          }}
                          title={`${f.id} \u2014 ${f.name}`}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{f.id}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-mono">
                              {f.id} \u2014 {f.name}
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OWASP_ASI.map((asi) => (
                      <tr
                        key={asi.id}
                        onClick={() => {
                          setSelectedASI(asi.id);
                          setView("detail");
                        }}
                        className="cursor-pointer transition-colors duration-100 hover:bg-[rgba(59,130,246,0.08)] group"
                      >
                        <td className="p-2 border-b border-slate-700/30 sticky left-0 bg-background group-hover:bg-[rgba(59,130,246,0.08)] z-10">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                              {asi.id}
                            </span>
                            <span className="text-slate-200 font-medium text-[11px]">{asi.name}</span>
                            <SeverityBadge level={asi.severity} />
                            <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                          </div>
                        </td>
                        {NIST_800_53.map((f) => (
                          <HeatCell key={f.id} count={heatmapData.data[asi.id][f.id]} max={heatmapData.maxVal} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </TooltipProvider>
              {/* Legend */}
              <div className="mt-4 flex gap-3 items-center text-[11px] text-slate-500">
                <span className="font-medium">Density:</span>
                {[
                  { bg: "rgba(15,23,42,0.5)", label: "0" },
                  { bg: "#3B82F640", label: "1-2" },
                  { bg: "#3B82F6", label: "3" },
                  { bg: "#1E40AF", label: "4+" },
                ].map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-sm border border-slate-600/50"
                      style={{ backgroundColor: l.bg }}
                    />
                    <span className="text-slate-400">{l.label}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── AI-RMF Heatmap View ─── */}
          {view === "aiRmf" && (
            <motion.div
              key="aiRmf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-4">
                <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  OWASP ASI → NIST AI-RMF Function Coverage
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Each cell shows how many AI-RMF subcategories map to that ASI risk across GOVERN, MAP, MEASURE, MANAGE.
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-700/50 scanline-overlay">
                <table className="w-full border-collapse" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th className="text-left p-3 bg-slate-900 text-slate-200 font-semibold min-w-[220px]">
                        OWASP ASI Risk
                      </th>
                      {AI_RMF.map((f) => (
                        <th
                          key={f.id}
                          className="text-center text-white font-bold p-3 min-w-[110px]"
                          style={{
                            backgroundColor: f.color,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "1px",
                          }}
                        >
                          {f.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OWASP_ASI.map((asi) => (
                      <tr
                        key={asi.id}
                        onClick={() => {
                          setSelectedASI(asi.id);
                          setView("detail");
                        }}
                        className="cursor-pointer transition-colors duration-100 hover:bg-[rgba(34,197,94,0.08)] group"
                      >
                        <td className="p-3 border-b border-slate-700/30">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                              {asi.id}
                            </span>
                            <span className="text-slate-200 font-medium">{asi.name}</span>
                            <SeverityBadge level={asi.severity} />
                            <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                          </div>
                        </td>
                        {AI_RMF.map((f) => (
                          <AIRmfHeatCell key={f.id} count={aiRmfHeatmap.data[asi.id][f.id]} max={aiRmfHeatmap.maxVal} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI-RMF subcategory legend */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {AI_RMF.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: `${f.color}08`,
                      borderColor: `${f.color}25`,
                    }}
                  >
                    <div
                      className="font-bold text-sm mb-2 flex items-center gap-2"
                      style={{ color: f.color, fontFamily: "var(--font-mono)" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: f.color }}
                      />
                      {f.name}
                    </div>
                    {f.cats.map((c) => (
                      <div key={c} className="text-[10px] text-slate-400 leading-relaxed pl-4">
                        {c}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── Evidence Explorer View ─── */}
          {view === "detail" && (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-4">
                <h2 className="text-base font-bold text-purple-400 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Evidence Explorer
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select an ASI risk to see the full crosswalk with NIST 800-53 controls, AI-RMF categories, rationale, and real-world evidence.
                </p>
              </div>

              {/* ASI selector pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {OWASP_ASI.map((asi) => (
                  <button
                    key={asi.id}
                    onClick={() => setSelectedASI(asi.id)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 border"
                    style={{
                      borderColor: selectedASI === asi.id ? "#3B82F6" : "#334155",
                      backgroundColor: selectedASI === asi.id ? "rgba(59,130,246,0.15)" : "transparent",
                      color: selectedASI === asi.id ? "#60A5FA" : "#94A3B8",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {asi.id}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {selected && selectedMeta ? (
                  <motion.div
                    key={selectedASI}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Header card */}
                    <div className="bg-slate-900 rounded-lg p-5 mb-5 border border-slate-700/50 glow-blue">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                        <div>
                          <div className="text-sm text-blue-400/70 mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                            {selectedMeta.id}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">{selectedMeta.name}</h3>
                          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                            {selectedMeta.desc}
                          </p>
                        </div>
                        <SeverityBadge level={selectedMeta.severity} />
                      </div>
                    </div>

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* 800-53 column */}
                      <div>
                        <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 rounded-full bg-blue-500" />
                          NIST 800-53 Rev 5 Controls
                        </h3>
                        {selected.nist53.map((mapping, i) => {
                          const fam = NIST_800_53.find((f) => f.id === mapping.family);
                          if (!fam) return null;
                          return (
                            <MappingCard
                              key={i}
                              title={`${fam.id} — ${fam.name}`}
                              color={fam.color}
                              items={[
                                ...mapping.controls.map((c) => ({ id: "", text: c })),
                                { id: "↳", text: mapping.rationale },
                              ]}
                            />
                          );
                        })}
                      </div>

                      {/* AI-RMF column */}
                      <div>
                        <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 rounded-full bg-emerald-500" />
                          NIST AI-RMF 100-1 Categories
                        </h3>
                        {selected.aiRmf.map((mapping, i) => {
                          const func = AI_RMF.find((f) => f.id === mapping.func);
                          if (!func) return null;
                          return (
                            <MappingCard
                              key={i}
                              title={func.name}
                              color={func.color}
                              items={[
                                ...mapping.cats.map((c) => ({ id: "", text: c })),
                                { id: "↳", text: mapping.rationale },
                              ]}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Evidence strip */}
                    <div className="mt-5 p-4 rounded-md border border-red-500/30 bg-red-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span className="font-bold text-xs text-red-400 uppercase tracking-wider">
                          Real-World Evidence
                        </span>
                      </div>
                      <div className="text-[11px] text-red-300/80 leading-relaxed">
                        {selected.evidence}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 text-slate-500"
                  >
                    <Shield className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <div className="text-sm">Select an ASI risk above to explore its crosswalk</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── Scenario Simulator View ─── */}
          {view === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ScenarioSimulator />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Footer ─── */}
      <footer className="container pb-8">
        <div className="rounded-lg bg-slate-900/50 border border-slate-700/30 px-5 py-4">
          {/* License badge */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] text-slate-300 font-medium">Licensed under</span>
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
              >
                AGPL-3.0
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/terms"
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-blue-400 transition-colors"
              >
                <FileText className="w-3 h-3" />
                Terms of Service
              </Link>
              <span className="text-slate-700">|</span>
              <a
                href="https://github.com/haremantra/OWASP-AGENTIC-to-NIST-800-53v5-to-AI-RMF"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Source Code
              </a>
            </div>
          </div>
          {/* Sources */}
          <p className="text-[10px] text-slate-500 leading-relaxed text-center">
            Sources: OWASP Top 10 for Agentic Applications v2026 (CC BY-SA 4.0) | NIST SP 800-53 Rev 5 | NIST AI 100-1 (AI RMF 1.0) | NIST AI 600-1 GenAI Profile
          </p>
          <p className="text-[10px] text-slate-600 mt-1 text-center">
            Copyright &copy; {new Date().getFullYear()} haremantra. All rights reserved for the hosted service. Source code available under AGPL-3.0.
          </p>
        </div>
      </footer>
    </div>
  );
}
