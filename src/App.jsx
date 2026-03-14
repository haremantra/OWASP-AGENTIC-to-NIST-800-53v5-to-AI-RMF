import { useState, useMemo } from "react";

// ─── Data Model: The Middleware Bridge ─────────────────────────────
const OWASP_ASI = [
  { id: "ASI01", name: "Agent Goal Hijack", severity: "Critical",
    desc: "Attackers redirect agent objectives through poisoned inputs. Agents cannot reliably distinguish instructions from data." },
  { id: "ASI02", name: "Tool Misuse & Exploitation", severity: "High",
    desc: "Agents misuse legitimate tools due to prompt injection, misalignment, or unsafe delegation within authorized scope." },
  { id: "ASI03", name: "Identity & Privilege Abuse", severity: "Critical",
    desc: "Dynamic trust and delegation exploited to escalate access via cached credentials, role inheritance, or confused deputies." },
  { id: "ASI04", name: "Supply Chain Vulnerabilities", severity: "High",
    desc: "Malicious or tampered tools, MCP descriptors, agent personas, or model weights compromise runtime execution." },
  { id: "ASI05", name: "Unexpected Code Execution", severity: "High",
    desc: "Agent-generated or externally influenced code executes in unintended ways — RCE, sandbox escape, persistence." },
  { id: "ASI06", name: "Memory & Context Poisoning", severity: "High",
    desc: "Corrupted RAG stores, long-term memory, or shared contexts persist across sessions and alter autonomous reasoning." },
  { id: "ASI07", name: "Insecure Inter-Agent Comms", severity: "Medium-High",
    desc: "Agent-to-agent channels lack authentication, encryption, or schema validation — enabling spoofing and replay attacks." },
  { id: "ASI08", name: "Cascading Failures", severity: "Critical",
    desc: "Single fault propagates across autonomous agents, compounding into system-wide harm beyond stepwise human checks." },
  { id: "ASI09", name: "Human-Agent Trust Exploitation", severity: "High",
    desc: "Agents abuse anthropomorphism and authority bias to socially engineer users into approving harmful actions." },
  { id: "ASI10", name: "Rogue Agents", severity: "Critical",
    desc: "Compromised or misaligned agents deviate from intended purpose while appearing compliant on the surface." },
];

const NIST_800_53 = [
  { id: "AC", name: "Access Control", color: "#2563EB" },
  { id: "AU", name: "Audit & Accountability", color: "#7C3AED" },
  { id: "CA", name: "Assessment & Authorization", color: "#059669" },
  { id: "CM", name: "Configuration Management", color: "#D97706" },
  { id: "CP", name: "Contingency Planning", color: "#DC2626" },
  { id: "IA", name: "Identification & Authentication", color: "#0891B2" },
  { id: "IR", name: "Incident Response", color: "#E11D48" },
  { id: "MP", name: "Media Protection", color: "#6366F1" },
  { id: "PE", name: "Physical & Environmental", color: "#78716C" },
  { id: "PL", name: "Planning", color: "#4F46E5" },
  { id: "PM", name: "Program Management", color: "#0D9488" },
  { id: "RA", name: "Risk Assessment", color: "#EA580C" },
  { id: "SA", name: "System & Services Acquisition", color: "#4338CA" },
  { id: "SC", name: "System & Comms Protection", color: "#1D4ED8" },
  { id: "SI", name: "System & Info Integrity", color: "#9333EA" },
  { id: "SR", name: "Supply Chain Risk Mgmt", color: "#B91C1C" },
];

const AI_RMF = [
  { id: "GOVERN", name: "GOVERN", color: "#2563EB",
    cats: ["GV-1 Policies & Processes", "GV-2 Accountability", "GV-3 Workforce Diversity", "GV-4 Organizational Practices", "GV-5 Stakeholder Engagement", "GV-6 Supply Chain & Third-Party"] },
  { id: "MAP", name: "MAP", color: "#059669",
    cats: ["MP-1 Context Establishment", "MP-2 Categorization", "MP-3 Benefits & Costs", "MP-4 Risks from Third Parties", "MP-5 Impact Characterization"] },
  { id: "MEASURE", name: "MEASURE", color: "#D97706",
    cats: ["MS-1 Risk Metrics", "MS-2 Trustworthiness Evaluation", "MS-3 Risk Tracking", "MS-4 Measurement Effectiveness"] },
  { id: "MANAGE", name: "MANAGE", color: "#DC2626",
    cats: ["MG-1 Risk Prioritization", "MG-2 Risk Treatment", "MG-3 Response & Recovery", "MG-4 Residual Risk"] },
];

// ─── The Crosswalk: Each ASI maps to 800-53 families AND AI-RMF categories ──
const CROSSWALK = {
  ASI01: {
    nist53: [
      { family: "AC", controls: ["AC-3 Access Enforcement", "AC-4 Information Flow", "AC-6 Least Privilege"], rationale: "Goal hijack exploits excessive agent permissions. AC-3/6 enforce least privilege for agent tool access and goal-change authority." },
      { family: "SI", controls: ["SI-3 Malicious Code Protection", "SI-5 Security Alerts", "SI-10 Information Input Validation"], rationale: "Input validation (SI-10) prevents prompt injection payloads from reaching goal-selection logic. SI-3 detects malicious instruction patterns." },
      { family: "AU", controls: ["AU-2 Event Logging", "AU-6 Audit Record Review", "AU-12 Audit Record Generation"], rationale: "Comprehensive logging of goal state, tool sequences, and behavioral baselines enables detection of unauthorized goal drift." },
      { family: "CM", controls: ["CM-3 Configuration Change Control", "CM-5 Access Restrictions for Change"], rationale: "Locking agent system prompts and requiring configuration management for goal changes maps directly to CM-3/5." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes", "GV-4 Organizational Practices"], rationale: "Goal-integrity policies, locked system prompts, and escalation thresholds require governance structures (GV-1). Red-team attestation cadence maps to GV-4." },
      { func: "MAP", cats: ["MP-1 Context Establishment", "MP-5 Impact Characterization"], rationale: "Establishing agent purpose boundaries (MP-1) and documenting the impact of goal-hijack scenarios (MP-5) are prerequisites for mitigation." },
      { func: "MEASURE", cats: ["MS-1 Risk Metrics", "MS-3 Risk Tracking"], rationale: "KRIs around goal drift — anomalous tool sequences, unexpected data access — feed continuous risk measurement (MS-1/3)." },
      { func: "MANAGE", cats: ["MG-1 Risk Prioritization", "MG-3 Response & Recovery"], rationale: "Goal override rollback procedures and kill-switch SLAs map to MG-3. Prioritization of goal-hijack as top-tier risk is MG-1." },
    ],
    evidence: "EchoLeak zero-click exfiltration via M365 Copilot; Calendar invite goal-lock drift; AgentFlayer inception attack on ChatGPT users."
  },
  ASI02: {
    nist53: [
      { family: "AC", controls: ["AC-3 Access Enforcement", "AC-6 Least Privilege", "AC-25 Reference Monitor"], rationale: "Per-tool least-privilege profiles (scopes, rate limits, egress allowlists) map directly to AC-3/6. Policy enforcement middleware is a reference monitor (AC-25)." },
      { family: "AU", controls: ["AU-2 Event Logging", "AU-12 Audit Record Generation", "AU-16 Cross-Organizational Audit"], rationale: "Immutable logs of all tool invocations, parameter recording, and anomalous chaining detection require AU-2/12." },
      { family: "CM", controls: ["CM-7 Least Functionality", "CM-11 User-Installed Software"], rationale: "Restricting agent tool availability to minimum required set maps to CM-7. Controlling tool installation in agent environments is CM-11." },
      { family: "SC", controls: ["SC-7 Boundary Protection", "SC-39 Process Isolation"], rationale: "Execution sandboxes with outbound allowlists (SC-7) and process isolation for tool execution (SC-39) prevent lateral movement." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes", "GV-6 Supply Chain & Third-Party"], rationale: "Tool Authorization Standards and Agent Tool Registries require governance policy (GV-1). Third-party tool vetting maps to GV-6." },
      { func: "MAP", cats: ["MP-2 Categorization", "MP-4 Risks from Third Parties"], rationale: "Categorizing tools by risk level (read-only vs destructive) and mapping third-party tool risks." },
      { func: "MEASURE", cats: ["MS-1 Risk Metrics", "MS-2 Trustworthiness Evaluation"], rationale: "Tool budgeting metrics (cost ceilings, rate limits) and drift detection form the measurement baseline." },
      { func: "MANAGE", cats: ["MG-2 Risk Treatment", "MG-3 Response & Recovery"], rationale: "Adaptive tool budgeting with automatic revocation (MG-2). Dry-run previews before destructive actions (MG-3)." },
    ],
    evidence: "Amazon Q secrets via DNS exfiltration; EDR bypass via tool chaining under trusted credentials; MCP tool descriptor poisoning."
  },
  ASI03: {
    nist53: [
      { family: "IA", controls: ["IA-2 User Identification", "IA-4 Identifier Management", "IA-5 Authenticator Management", "IA-9 Service Identification"], rationale: "Per-agent cryptographic identity, mTLS certificates, and scoped OAuth tokens map to IA-2/4/5. Agent service identification is IA-9." },
      { family: "AC", controls: ["AC-2 Account Management", "AC-5 Separation of Duties", "AC-6 Least Privilege"], rationale: "Agent identity lifecycle (joiner-mover-leaver), task-scoped permissions, and preventing privilege inheritance across agents." },
      { family: "AU", controls: ["AU-2 Event Logging", "AU-10 Non-repudiation"], rationale: "Delegation chain logging and credential-lifetime tracking require audit capabilities with non-repudiation." },
      { family: "SC", controls: ["SC-23 Session Authenticity"], rationale: "Binding OAuth tokens to signed intent (subject, audience, purpose, session) prevents TOCTOU and session reuse attacks." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes", "GV-2 Accountability"], rationale: "Extending enterprise IAM to non-human agent identities. Accountability for transitive privilege grants." },
      { func: "MAP", cats: ["MP-1 Context Establishment", "MP-4 Risks from Third Parties"], rationale: "Mapping delegation chains and cross-agent trust boundaries as risk context." },
      { func: "MEASURE", cats: ["MS-1 Risk Metrics", "MS-3 Risk Tracking"], rationale: "Credential-lifetime sampling, delegation-depth metrics, and access certification pass rates." },
      { func: "MANAGE", cats: ["MG-2 Risk Treatment", "MG-4 Residual Risk"], rationale: "Automated revocation on session termination (MG-2). Residual risk from implicit trust inheritance (MG-4)." },
    ],
    evidence: "CVE-2025-31491; Confused deputy via cross-agent trust; Memory-based SSH credential escalation; Forged Agent Persona registration."
  },
  ASI04: {
    nist53: [
      { family: "SR", controls: ["SR-1 Policy & Procedures", "SR-2 Supply Chain Risk Mgmt Plan", "SR-3 Supply Chain Controls", "SR-4 Provenance", "SR-11 Component Authenticity"], rationale: "Direct mapping: AIBOM governance, provenance verification, signature validation, and kill-switch procedures are SR controls." },
      { family: "SA", controls: ["SA-9 External System Services", "SA-12 Supply Chain Protection"], rationale: "Third-party MCP server vetting, agent persona validation, and runtime integrity checks." },
      { family: "CM", controls: ["CM-2 Baseline Configuration", "CM-3 Configuration Change Control"], rationale: "Pinning prompts, tools, and configs by content hash and commit ID with staged rollout." },
      { family: "SI", controls: ["SI-7 Software & Information Integrity"], rationale: "Runtime signature re-validation and behavioral monitoring for tampered components." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-6 Supply Chain & Third-Party"], rationale: "Agentic Component Governance Policy requiring AIBOM for all third-party tools, MCP servers, and agent personas." },
      { func: "MAP", cats: ["MP-4 Risks from Third Parties"], rationale: "Mapping supply-chain attack surface including runtime component loading and dynamic tool discovery." },
      { func: "MEASURE", cats: ["MS-2 Trustworthiness Evaluation"], rationale: "Evaluating provenance, signature validity, and typosquat scanning results." },
      { func: "MANAGE", cats: ["MG-1 Risk Prioritization", "MG-3 Response & Recovery"], rationale: "Supply-chain kill switches for emergency revocation. Blast-radius estimates for compromised components." },
    ],
    evidence: "Amazon Q supply chain compromise; MCP Tool Descriptor Poisoning; Malicious Postmark MCP server; AgentSmith Prompt-Hub proxy attack."
  },
  ASI05: {
    nist53: [
      { family: "SI", controls: ["SI-3 Malicious Code Protection", "SI-7 Software Integrity", "SI-10 Information Input Validation", "SI-16 Memory Protection"], rationale: "Static scanning before execution, taint-tracking on generated code, and memory protection against RCE exploits." },
      { family: "SC", controls: ["SC-39 Process Isolation", "SC-44 Detonation Chambers"], rationale: "Sandboxed containers with no root access, network egress restrictions, and detonation chambers for untrusted code." },
      { family: "CM", controls: ["CM-7 Least Functionality", "CM-14 Signed Components"], rationale: "Banning eval in production agents, requiring safe interpreters, and signed code validation." },
      { family: "AC", controls: ["AC-3 Access Enforcement", "AC-6 Least Privilege"], rationale: "Separating code generation from execution with validation gates and role-based execution controls." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes"], rationale: "Code Execution Risk Policy mandating security gates for all agent-generated code before production execution." },
      { func: "MAP", cats: ["MP-5 Impact Characterization"], rationale: "Documenting RCE blast radius, sandbox escape scenarios, and dependency poisoning pathways." },
      { func: "MEASURE", cats: ["MS-1 Risk Metrics"], rationale: "Tracking code-generation security scan pass rates, sandbox escape attempts, and dependency integrity scores." },
      { func: "MANAGE", cats: ["MG-2 Risk Treatment", "MG-3 Response & Recovery"], rationale: "Kill switch and sandbox isolation as containment procedures. Rollback capabilities for corrupted environments." },
    ],
    evidence: "Replit vibe-coding agents executing unreviewed install commands; Direct shell injection via embedded prompts; Dependency lockfile poisoning."
  },
  ASI06: {
    nist53: [
      { family: "SC", controls: ["SC-8 Transmission Confidentiality", "SC-28 Protection of Information at Rest"], rationale: "Encryption of memory stores in transit and at rest. Protecting RAG indexes and vector databases." },
      { family: "SI", controls: ["SI-4 System Monitoring", "SI-7 Software Integrity"], rationale: "Content scanning of memory writes, anomalous update frequency detection, and provenance verification." },
      { family: "AC", controls: ["AC-3 Access Enforcement", "AC-4 Information Flow"], rationale: "Memory segmentation by tenant/user/domain. Preventing cross-tenant vector bleed through access controls." },
      { family: "AU", controls: ["AU-2 Event Logging", "AU-10 Non-repudiation"], rationale: "Provenance tracking (who wrote what, when) for all memory entries with tamper-evident logging." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes", "GV-4 Organizational Practices"], rationale: "Memory Integrity Standard treating agent memory as critical data assets under enterprise data governance." },
      { func: "MAP", cats: ["MP-2 Categorization"], rationale: "Classifying memory stores by sensitivity, access requirements, and poisoning risk." },
      { func: "MEASURE", cats: ["MS-1 Risk Metrics", "MS-3 Risk Tracking"], rationale: "KRIs around anomalous memory-write patterns, cross-tenant access attempts, and self-referential loops." },
      { func: "MANAGE", cats: ["MG-3 Response & Recovery"], rationale: "Memory rollback capabilities, snapshot/versioning, and tested recovery procedures." },
    ],
    evidence: "Gemini long-term memory corruption via prompt injection; ChatGPT persistent false memory planting; Cross-tenant vector namespace bleed."
  },
  ASI07: {
    nist53: [
      { family: "SC", controls: ["SC-8 Transmission Confidentiality", "SC-12 Cryptographic Key Mgmt", "SC-13 Cryptographic Protection", "SC-23 Session Authenticity"], rationale: "End-to-end encryption, mutual authentication, PKI certificate pinning, and forward secrecy for inter-agent channels." },
      { family: "IA", controls: ["IA-3 Device Identification", "IA-9 Service Identification"], rationale: "Per-agent cryptographic identity and mutual authentication for discovery and routing." },
      { family: "SI", controls: ["SI-10 Information Input Validation"], rationale: "Schema validation for inter-agent messages, detecting hidden or modified natural-language instructions." },
      { family: "AU", controls: ["AU-2 Event Logging"], rationale: "Inter-agent traffic logging for encryption, signing, and schema validation verification." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes"], rationale: "Inter-Agent Communication Security Standard mandating mutual auth, E2E encryption, and message integrity." },
      { func: "MAP", cats: ["MP-1 Context Establishment"], rationale: "Communication topology mapping documenting all inter-agent channels, protocols, and trust relationships." },
      { func: "MEASURE", cats: ["MS-2 Trustworthiness Evaluation"], rationale: "Testing anti-replay protections and protocol version pinning during pre-production security reviews." },
      { func: "MANAGE", cats: ["MG-2 Risk Treatment"], rationale: "Protocol pinning, version enforcement, and discovery message authentication." },
    ],
    evidence: "Semantic injection over unencrypted HTTP channels; Trust poisoning via altered reputation messages; MCP descriptor spoofing."
  },
  ASI08: {
    nist53: [
      { family: "CP", controls: ["CP-2 Contingency Plan", "CP-10 System Recovery"], rationale: "Business continuity for multi-agent systems. Digital twin replay testing and defined RTOs/RPOs for recovery." },
      { family: "SC", controls: ["SC-7 Boundary Protection", "SC-39 Process Isolation"], rationale: "Agent isolation with strict I/O validation. Network segmentation between trust zones." },
      { family: "RA", controls: ["RA-3 Risk Assessment", "RA-5 Vulnerability Monitoring"], rationale: "Blast-radius assessment mapping maximum downstream impact and propagation pathways." },
      { family: "IR", controls: ["IR-4 Incident Handling", "IR-5 Incident Monitoring"], rationale: "Circuit breakers, rate limiting, and automated isolation of faulty agents during cascading events." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes", "GV-4 Organizational Practices"], rationale: "Classifying cascading failure as enterprise-level systemic risk. Circuit breaker mandates at inter-agent boundaries." },
      { func: "MAP", cats: ["MP-5 Impact Characterization"], rationale: "Blast-radius assessment estimating maximum downstream impact of single-agent faults." },
      { func: "MEASURE", cats: ["MS-3 Risk Tracking"], rationale: "Digital twin replay testing — re-running recorded actions in isolated environments to detect cascade potential." },
      { func: "MANAGE", cats: ["MG-3 Response & Recovery", "MG-4 Residual Risk"], rationale: "Emergency isolation procedures, governance drift monitoring, and residual systemic risk tracking." },
    ],
    evidence: "Financial trading cascade via prompt-injected risk limits; Healthcare protocol propagation from supply-chain tampering; Auto-remediation feedback loops."
  },
  ASI09: {
    nist53: [
      { family: "AC", controls: ["AC-3 Access Enforcement"], rationale: "Mandatory friction for high-risk actions — confirmation prompts, cooling-off periods, risk badges." },
      { family: "AU", controls: ["AU-2 Event Logging", "AU-6 Audit Record Review"], rationale: "Immutable logs of user queries, agent recommendations, and approval decisions for forensic review." },
      { family: "PM", controls: ["PM-13 Security & Privacy Workforce", "PM-14 Testing Training & Monitoring"], rationale: "Annual training for personnel on automation bias, anthropomorphism risks, and AI social engineering." },
      { family: "PL", controls: ["PL-4 Rules of Behavior"], rationale: "Human-Agent Interaction Governance Standard defining rules for how humans must verify agent recommendations." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes", "GV-5 Stakeholder Engagement"], rationale: "Human-Agent Interaction Governance Standard. Stakeholder engagement ensuring users understand automation bias." },
      { func: "MAP", cats: ["MP-3 Benefits & Costs"], rationale: "Mapping the cost of over-trust — analyzing where rubber-stamping agent recommendations creates systemic risk." },
      { func: "MEASURE", cats: ["MS-1 Risk Metrics"], rationale: "KRI: tracking override rates (human reviewers overriding vs rubber-stamping agent recommendations)." },
      { func: "MANAGE", cats: ["MG-2 Risk Treatment"], rationale: "Confidence-weighted cues, risk badges, and separate preview-from-effect mechanisms." },
    ],
    evidence: "Helpful Assistant Trojan exfiltrating code; Credential harvesting via contextual deception; Invoice Copilot Fraud; Weaponized Explainability."
  },
  ASI10: {
    nist53: [
      { family: "AU", controls: ["AU-2 Event Logging", "AU-6 Audit Record Review", "AU-12 Audit Record Generation"], rationale: "Comprehensive signed audit logs of all agent actions, tool calls, and inter-agent communications." },
      { family: "IR", controls: ["IR-4 Incident Handling", "IR-6 Incident Reporting"], rationale: "Kill-switch and credential revocation procedures. Quarantine of suspicious agents for forensic review." },
      { family: "CA", controls: ["CA-7 Continuous Monitoring", "CA-8 Penetration Testing"], rationale: "Behavioral drift detection comparing actual actions against declared manifests. Periodic red-team testing." },
      { family: "SC", controls: ["SC-7 Boundary Protection", "SC-39 Process Isolation"], rationale: "Trust zones with strict inter-zone rules. Preventing unauthorized self-replication via network segmentation." },
    ],
    aiRmf: [
      { func: "GOVERN", cats: ["GV-1 Policies & Processes", "GV-2 Accountability"], rationale: "Rogue Agent Detection & Response Framework. Signed behavioral manifests declaring expected capabilities." },
      { func: "MAP", cats: ["MP-2 Categorization"], rationale: "Categorizing agent collusion and self-replication as critical risk scenarios requiring specific containment." },
      { func: "MEASURE", cats: ["MS-1 Risk Metrics", "MS-3 Risk Tracking"], rationale: "Behavioral drift detection metrics. Tool-use pattern monitoring against baseline manifests." },
      { func: "MANAGE", cats: ["MG-1 Risk Prioritization", "MG-3 Response & Recovery"], rationale: "Kill-switch SLA testing (quarterly). Automatic quarantine pending forensic review with risk committee reporting." },
    ],
    evidence: "Impersonated observer agent approving fraudulent transactions; Compromised automation agent spawning unauthorized replicas; Reward-hacking DR deletion."
  },
};

const severityColor = { Critical: "#DC2626", High: "#D97706", "Medium-High": "#2563EB" };

// ─── Components ──────────────────────────────────────────────────
function SeverityBadge({ level }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 12,
      fontSize: 11, fontWeight: 700, color: "white",
      backgroundColor: severityColor[level] || "#64748B"
    }}>
      {level}
    </span>
  );
}

function FlowLine({ from, to, color = "#CBD5E1" }) {
  return (
    <div style={{
      height: 2, flex: 1, backgroundColor: color,
      margin: "0 4px", minWidth: 20, opacity: 0.6
    }} />
  );
}

function MappingCard({ title, items, color }) {
  return (
    <div style={{
      border: `1px solid ${color}22`, borderLeft: `4px solid ${color}`,
      borderRadius: 6, padding: "10px 14px", marginBottom: 8,
      backgroundColor: `${color}08`
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color, marginBottom: 4 }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 11, lineHeight: 1.5, color: "#334155", marginBottom: 4 }}>
          <span style={{ fontFamily: "monospace", fontWeight: 600, color }}>{item.id || ""}</span>{" "}
          {item.text}
        </div>
      ))}
    </div>
  );
}

function HeatCell({ count, max }) {
  const intensity = max > 0 ? count / max : 0;
  const bg = count === 0 ? "#F8FAFC"
    : intensity > 0.7 ? "#1E40AF" : intensity > 0.4 ? "#3B82F6" : "#93C5FD";
  const textColor = intensity > 0.4 ? "white" : "#1E293B";
  return (
    <td style={{
      backgroundColor: bg, color: textColor, textAlign: "center",
      padding: "6px 4px", fontSize: 11, fontWeight: count > 0 ? 700 : 400,
      border: "1px solid #E2E8F0", minWidth: 36
    }}>
      {count || ""}
    </td>
  );
}

// ─── Main App ────────────────────────────────────────────────────
export default function App() {
  const [selectedASI, setSelectedASI] = useState(null);
  const [view, setView] = useState("matrix"); // matrix | detail | sankey

  // Compute heatmap data
  const heatmapData = useMemo(() => {
    const data = {};
    let maxVal = 0;
    OWASP_ASI.forEach(asi => {
      data[asi.id] = {};
      const cw = CROSSWALK[asi.id];
      NIST_800_53.forEach(fam => {
        const match = cw.nist53.find(n => n.family === fam.id);
        const count = match ? match.controls.length : 0;
        data[asi.id][fam.id] = count;
        if (count > maxVal) maxVal = count;
      });
    });
    return { data, maxVal };
  }, []);

  const aiRmfHeatmap = useMemo(() => {
    const data = {};
    let maxVal = 0;
    OWASP_ASI.forEach(asi => {
      data[asi.id] = {};
      const cw = CROSSWALK[asi.id];
      AI_RMF.forEach(func => {
        const match = cw.aiRmf.find(a => a.func === func.id);
        const count = match ? match.cats.length : 0;
        data[asi.id][func.id] = count;
        if (count > maxVal) maxVal = count;
      });
    });
    return { data, maxVal };
  }, []);

  const selected = selectedASI ? CROSSWALK[selectedASI] : null;
  const selectedMeta = selectedASI ? OWASP_ASI.find(a => a.id === selectedASI) : null;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1100, margin: "0 auto", padding: 20, color: "#1E293B" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#2563EB", padding: "24px 28px", borderRadius: "8px 8px 0 0", color: "white" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8, marginBottom: 4 }}>COMPLIANCE MIDDLEWARE</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>OWASP Agentic AI ↔ NIST Crosswalk</h1>
        <div style={{ fontSize: 13, marginTop: 6, opacity: 0.9 }}>
          Bridging ASI 2026 → NIST 800-53 Rev 5 → NIST AI-RMF 100-1
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #E2E8F0" }}>
        {[
          { key: "matrix", label: "800-53 Heatmap" },
          { key: "aiRmf", label: "AI-RMF Heatmap" },
          { key: "detail", label: "Evidence Explorer" },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setView(tab.key); setSelectedASI(null); }}
            style={{
              padding: "12px 24px", border: "none", cursor: "pointer",
              fontWeight: view === tab.key ? 700 : 400, fontSize: 13,
              color: view === tab.key ? "#2563EB" : "#64748B",
              backgroundColor: view === tab.key ? "#EFF6FF" : "white",
              borderBottom: view === tab.key ? "3px solid #2563EB" : "3px solid transparent",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: "white", padding: 20, border: "1px solid #E2E8F0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>

        {/* ─── 800-53 Heatmap View ─── */}
        {view === "matrix" && (
          <div>
            <h2 style={{ fontSize: 16, color: "#2563EB", marginBottom: 4 }}>OWASP ASI → NIST 800-53 Rev 5 Control Density</h2>
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
              Each cell shows how many specific 800-53 controls map to that ASI risk. Darker = more controls engaged. Click any ASI row for full detail.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 6, backgroundColor: "#0F172A", color: "white", minWidth: 160, borderRadius: "4px 0 0 0" }}>OWASP ASI</th>
                    {NIST_800_53.map(f => (
                      <th key={f.id} style={{ padding: "6px 2px", backgroundColor: "#0F172A", color: "white", fontSize: 9, writingMode: "vertical-rl", textOrientation: "mixed", height: 80 }}>
                        {f.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OWASP_ASI.map(asi => (
                    <tr key={asi.id} onClick={() => { setSelectedASI(asi.id); setView("detail"); }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#F0F9FF"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: 6, fontWeight: 600, fontSize: 11, borderBottom: "1px solid #E2E8F0" }}>
                        <span style={{ color: "#2563EB", fontFamily: "monospace" }}>{asi.id}</span>{" "}
                        <span style={{ color: "#334155" }}>{asi.name}</span>{" "}
                        <SeverityBadge level={asi.severity} />
                      </td>
                      {NIST_800_53.map(f => (
                        <HeatCell key={f.id} count={heatmapData.data[asi.id][f.id]} max={heatmapData.maxVal} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: "#64748B" }}>
              <span>Density:</span>
              {[{ bg: "#F8FAFC", label: "0" }, { bg: "#93C5FD", label: "1-2" }, { bg: "#3B82F6", label: "3" }, { bg: "#1E40AF", label: "4+" }].map(l => (
                <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: l.bg, border: "1px solid #E2E8F0" }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── AI-RMF Heatmap View ─── */}
        {view === "aiRmf" && (
          <div>
            <h2 style={{ fontSize: 16, color: "#059669", marginBottom: 4 }}>OWASP ASI → NIST AI-RMF Function Coverage</h2>
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
              Each cell shows how many AI-RMF subcategories map to that ASI risk across GOVERN, MAP, MEASURE, MANAGE.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, backgroundColor: "#0F172A", color: "white", minWidth: 200 }}>OWASP ASI</th>
                    {AI_RMF.map(f => (
                      <th key={f.id} style={{ padding: 8, backgroundColor: f.color, color: "white", textAlign: "center", minWidth: 100 }}>
                        {f.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OWASP_ASI.map(asi => (
                    <tr key={asi.id} onClick={() => { setSelectedASI(asi.id); setView("detail"); }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#F0FDF4"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: 8, fontWeight: 600, borderBottom: "1px solid #E2E8F0" }}>
                        <span style={{ color: "#059669", fontFamily: "monospace" }}>{asi.id}</span>{" "}
                        {asi.name} <SeverityBadge level={asi.severity} />
                      </td>
                      {AI_RMF.map(f => (
                        <HeatCell key={f.id} count={aiRmfHeatmap.data[asi.id][f.id]} max={aiRmfHeatmap.maxVal} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* AI-RMF subcategory legend */}
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {AI_RMF.map(f => (
                <div key={f.id} style={{ padding: 12, backgroundColor: `${f.color}08`, border: `1px solid ${f.color}22`, borderRadius: 6 }}>
                  <div style={{ fontWeight: 700, color: f.color, fontSize: 13, marginBottom: 6 }}>{f.name}</div>
                  {f.cats.map(c => (
                    <div key={c} style={{ fontSize: 10, color: "#334155", lineHeight: 1.6 }}>{c}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Evidence Explorer View ─── */}
        {view === "detail" && (
          <div>
            <h2 style={{ fontSize: 16, color: "#7C3AED", marginBottom: 4 }}>Evidence Explorer</h2>
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
              Select an ASI risk to see the full crosswalk with NIST 800-53 controls, AI-RMF categories, rationale, and real-world evidence.
            </p>
            {/* ASI selector */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
              {OWASP_ASI.map(asi => (
                <button key={asi.id} onClick={() => setSelectedASI(asi.id)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: selectedASI === asi.id ? "2px solid #2563EB" : "1px solid #CBD5E1",
                    backgroundColor: selectedASI === asi.id ? "#EFF6FF" : "white",
                    color: selectedASI === asi.id ? "#2563EB" : "#64748B",
                    cursor: "pointer"
                  }}>
                  {asi.id}
                </button>
              ))}
            </div>

            {selected && selectedMeta && (
              <div>
                {/* Header card */}
                <div style={{ backgroundColor: "#0F172A", padding: 20, borderRadius: 8, color: "white", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, opacity: 0.7 }}>{selectedMeta.id}</div>
                      <h3 style={{ margin: "4px 0", fontSize: 20 }}>{selectedMeta.name}</h3>
                      <p style={{ fontSize: 12, opacity: 0.8, maxWidth: 600, lineHeight: 1.6 }}>{selectedMeta.desc}</p>
                    </div>
                    <SeverityBadge level={selectedMeta.severity} />
                  </div>
                </div>

                {/* Two-column layout */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* 800-53 column */}
                  <div>
                    <h3 style={{ fontSize: 14, color: "#2563EB", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 4, height: 20, backgroundColor: "#2563EB", borderRadius: 2 }} />
                      NIST 800-53 Rev 5 Controls
                    </h3>
                    {selected.nist53.map((mapping, i) => {
                      const fam = NIST_800_53.find(f => f.id === mapping.family);
                      return (
                        <MappingCard key={i} title={`${fam.id} — ${fam.name}`} color={fam.color}
                          items={[
                            ...mapping.controls.map(c => ({ id: "", text: c })),
                            { id: "↳", text: mapping.rationale }
                          ]}
                        />
                      );
                    })}
                  </div>

                  {/* AI-RMF column */}
                  <div>
                    <h3 style={{ fontSize: 14, color: "#059669", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 4, height: 20, backgroundColor: "#059669", borderRadius: 2 }} />
                      NIST AI-RMF 100-1 Categories
                    </h3>
                    {selected.aiRmf.map((mapping, i) => {
                      const func = AI_RMF.find(f => f.id === mapping.func);
                      return (
                        <MappingCard key={i} title={func.name} color={func.color}
                          items={[
                            ...mapping.cats.map(c => ({ id: "", text: c })),
                            { id: "↳", text: mapping.rationale }
                          ]}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Evidence strip */}
                <div style={{
                  marginTop: 16, padding: 14, backgroundColor: "#FEF2F2",
                  borderLeft: "4px solid #DC2626", borderRadius: 4
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#991B1B", marginBottom: 4 }}>REAL-WORLD EVIDENCE</div>
                  <div style={{ fontSize: 11, color: "#7F1D1D", lineHeight: 1.7 }}>{selected.evidence}</div>
                </div>
              </div>
            )}

            {!selected && (
              <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>↑</div>
                <div style={{ fontSize: 14 }}>Select an ASI risk above to explore its crosswalk</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, padding: "12px 20px", backgroundColor: "#F8FAFC", borderRadius: 8, fontSize: 10, color: "#94A3B8", textAlign: "center" }}>
        Sources: OWASP Top 10 for Agentic Applications v2026 (CC BY-SA 4.0) | NIST SP 800-53 Rev 5 | NIST AI 100-1 (AI RMF 1.0) | NIST AI 600-1 GenAI Profile
      </div>
    </div>
  );
}
