# Changelog

All notable changes to the **OWASP Agentic AI ↔ NIST Crosswalk** are documented in this file. This is not a conventional changelog of version bumps and bug fixes. It is a **decision log** — a record of the conceptual reasoning, data integrity corrections, and design philosophy shifts that have shaped this crosswalk from its initial commit to its current form. Each entry explains not just *what* changed, but *why* it matters for compliance practitioners, auditors, and security architects working at the intersection of agentic AI and federal control frameworks.

This project follows a philosophy of **transparent provenance**: every editorial judgment is disclosed, every scope limitation is documented, and every data distinction (unique vs. aggregate) is surfaced to the reader rather than buried in computed totals.

---

## [0.3.0] — 2026-03-15

### Content Accuracy and Intellectual Honesty Overhaul

This release represents the most significant conceptual revision since the initial commit. Five targeted changes were made, each addressing a specific gap in how the crosswalk communicates its editorial boundaries, data precision, and scope limitations to the reader. No styling, layout, or visual design was altered — these are purely content and data integrity changes.

#### Decision Point 1 — Severity Badge Disclaimer

**What changed.** A disclosure sentence was appended to the header subtitle: *"Severity ratings (Critical, High, Medium-High) are editorially assigned based on OWASP ordinal risk ranking and are not official OWASP severity classifications."*

**Why it matters.** The original crosswalk displayed severity badges (Critical, High, Medium-High) next to each ASI risk without any attribution methodology. A compliance practitioner encountering this tool could reasonably assume these ratings were assigned by OWASP itself as part of the ASI 2026 specification. They are not. The OWASP Top 10 for Agentic Applications presents risks in ordinal rank order (ASI01 is the highest-priority risk, ASI10 the lowest) but does not assign severity labels in the CVSS or qualitative-rating sense. The severity badges in this crosswalk are **editorial interpretations** derived from the ordinal ranking: the top four risks (ASI01, ASI03, ASI08, ASI10) were classified as Critical based on their potential for autonomous, system-wide harm; the middle five (ASI02, ASI04, ASI05, ASI06, ASI09) as High; and ASI07 as Medium-High given its dependency on specific multi-agent architectures. Disclosing this methodology prevents the crosswalk from being cited as an authoritative OWASP severity classification when it is, in fact, an editorial overlay.

#### Decision Point 2 — Distinguishing Unique Controls from Total Mappings

**What changed.** The stat card previously labeled "800-53 CONTROLS" showing the value **90** was revised to display **"UNIQUE 800-53 CONTROLS"** with a dynamically computed count of distinct control identifiers (56), accompanied by a subtitle: *"90 total control mappings across 10 ASI risks."*

**Why it matters.** The original value of 90 was the sum of all `controls.length` values across every `nist53` entry in the crosswalk — a measure of **mapping density**, not control breadth. This is a critical distinction for compliance teams. A CISO reading "90 controls" might conclude that the crosswalk engages 90 distinct NIST 800-53 controls, implying broad coverage of the SP 800-53 catalog (which contains over 1,000 controls across 20 families). In reality, many controls appear in multiple ASI mappings because they are foundational to agentic AI security. For example, AC-3 (Access Enforcement) and AU-2 (Event Logging) each appear in six or more ASI risk mappings. The revised presentation makes both numbers visible: the unique count tells the reader how many distinct controls are engaged, while the total tells them how densely those controls are mapped across the threat landscape. This dual-number approach follows the principle that **aggregate statistics without decomposition obscure more than they reveal** in compliance contexts.

#### Decision Point 3 — Distinguishing Unique AI-RMF Categories from Total Mappings

**What changed.** The stat card previously labeled "AI-RMF CATEGORIES" showing the value **62** was revised to display **"UNIQUE AI-RMF CATEGORIES"** with the value **19**, accompanied by a subtitle: *"62 total category mappings across 10 ASI risks."*

**Why it matters.** The reasoning mirrors Decision Point 2 but carries additional weight because the AI-RMF category space is inherently smaller. The NIST AI Risk Management Framework (AI 100-1) defines exactly 19 subcategories across four functions: GOVERN (GV-1 through GV-6), MAP (MP-1 through MP-5), MEASURE (MS-1 through MS-4), and MANAGE (MG-1 through MG-4). The original display of "62" — the sum of all category references across all ASI mappings — could mislead a reader into thinking the AI-RMF contains 62 subcategories, or that this crosswalk references 62 distinct categories from a larger taxonomy. Neither is true. The crosswalk achieves **complete coverage** of all 19 AI-RMF subcategories, and the 62 figure represents the total number of times those 19 categories are referenced across 10 ASI risks. Surfacing "19" as the primary number immediately communicates full-framework coverage — a significant finding for organizations attempting to satisfy AI-RMF requirements through their agentic AI security program.

#### Decision Point 4 — Heatmap Scope Disclosure

**What changed.** An italic annotation was added below the 800-53 heatmap subtitle: *"Scope: 16 of 20 NIST 800-53 Rev 5 control families are represented. Families AT (Awareness & Training), MA (Maintenance), PS (Personnel Security), and PT (PII Transparency) were excluded as lower relevance to agentic AI threat vectors."*

**Why it matters.** The 800-53 heatmap displays 16 column headers representing NIST control families. Without disclosure, a reader might assume these are the only families in SP 800-53, or that the four missing families were accidentally omitted. In fact, their exclusion was a deliberate editorial decision. AT (Awareness & Training) was excluded because its controls focus on human training programs rather than technical agent controls — though this decision is itself nuanced, as noted in Decision Point 5 below. MA (Maintenance) addresses physical system maintenance schedules with limited applicability to software-defined agent architectures. PS (Personnel Security) governs human personnel screening, which does not directly map to non-human agent identity management (though the conceptual parallel is acknowledged in the ASI03 mapping via IA-family controls). PT (PII Processing and Transparency) was excluded because the crosswalk focuses on security controls rather than privacy-specific requirements, though organizations with privacy obligations should evaluate PT controls independently. Disclosing these exclusions and their rationale transforms the heatmap from a potentially misleading "complete picture" into an honest scoped analysis.

#### Decision Point 5 — ASI09 Rationale Supplement for AT-Family Applicability

**What changed.** The rationale string for ASI09's PM-family mapping was supplemented with: *"Note: AT-2 (Literacy Training) and AT-3 (Role-Based Training) from the AT family are also directly applicable but are not included in this crosswalk's scope."*

**Why it matters.** This change creates an explicit bridge between Decision Point 4 (the scope exclusion of the AT family) and a specific ASI risk where that exclusion has material consequences. ASI09 (Human-Agent Trust Exploitation) addresses the risk that agents exploit anthropomorphism and authority bias to socially engineer users. The most direct NIST 800-53 countermeasure for this risk is training — specifically, AT-2 (Literacy Training and Awareness) which covers security awareness for recognizing social engineering, and AT-3 (Role-Based Training) which provides specialized training for personnel in roles where automation bias is a factor. By mapping ASI09 only to PM-13 and PM-14 (which address workforce planning and monitoring rather than training content), the original crosswalk created a gap: the reader sees a training-adjacent control but not the training controls themselves. The supplemental note acknowledges this gap without breaking the crosswalk's scoping decision. It tells the reader: "We know AT-2 and AT-3 belong here conceptually, and we chose not to include the AT family for scope reasons, but you should evaluate them independently." This pattern of **acknowledging what was excluded and why** is essential for crosswalks that will be used in audit and compliance contexts, where omissions can be as consequential as inclusions.

### Stat Card Architecture

Beyond the five content changes, this release introduced a stat card row between the header and navigation tabs. The four cards (ASI Risks, Unique 800-53 Controls, Unique AI-RMF Categories, Critical Risks) provide an at-a-glance summary that serves two audiences: executives who need coverage metrics for board reporting, and practitioners who need to quickly assess the crosswalk's scope before diving into heatmaps. The subtitle pattern (showing total mappings below unique counts) was designed to preempt the most common misreading of compliance dashboards: conflating mapping density with control breadth.

### Footer — License and Legal Visibility

The footer was updated to include direct links to the AGPL-3.0 license, Terms of Service, and source code repository. This ensures that every rendered instance of the crosswalk — whether deployed via GitHub Pages, embedded in a compliance tool, or shared as a screenshot — carries its legal provenance.

---

## [0.2.0] — 2026-03-14

### Governance, Licensing, and Legal Framework

This release established the legal and documentation foundation for the project, adding three files that collectively define how the crosswalk can be used, shared, and built upon.

#### README.md — The Case for a Crosswalk

The README was written not as a technical setup guide (though it includes one) but as a **conceptual argument** for why compliance crosswalks between OWASP agentic AI risks and federal control frameworks are necessary. The core thesis is that organizations face a three-layer governance gap: OWASP identifies *what can go wrong* with agentic AI systems, NIST 800-53 prescribes *how to control information systems*, and NIST AI-RMF defines *how to govern AI risk* — but no authoritative document maps between them. Without a crosswalk, security teams must independently derive these mappings for every audit cycle, leading to inconsistent control selection, redundant compliance efforts, and gaps where agentic-specific risks fall between framework boundaries.

The README also documents the project's three-layer data architecture (OWASP ASI as the threat layer, NIST 800-53 as the control layer, AI-RMF as the governance layer) and provides step-by-step local installation instructions for practitioners who want to run the crosswalk locally or fork it for their own compliance programs.

#### LICENSE — AGPL-3.0

The GNU Affero General Public License v3.0 was chosen deliberately over MIT or Apache-2.0. The AGPL's network-use clause (Section 13) requires that any organization deploying a modified version of this crosswalk as a network service must make their source code available. This prevents a scenario where a consulting firm forks the crosswalk, adds proprietary mappings, deploys it as a paid SaaS tool, and removes attribution — while still benefiting from the community's original mapping work. The AGPL ensures that improvements to the crosswalk data flow back to the community.

#### TERMS_OF_SERVICE.md — Protecting the Developer

The Terms of Service establishes a legal distinction between the source code (governed by AGPL-3.0, freely forkable) and the hosted service (governed by SaaS terms that prohibit service replication, scraping, and commercial resale). This dual-licensing approach protects the developer's ability to operate a hosted version while keeping the underlying data and code open. Key provisions include a liability cap ($100), binding arbitration, and indemnification clauses that are standard for developer-protective SaaS agreements.

---

## [0.1.1] — 2026-03-14

### GitHub Pages Deployment Removal

The GitHub Pages deployment was replaced with a notice redirecting users to the primary hosted application. This decision was made because the Parcel-built static site on GitHub Pages lacked the enhanced design, stat cards, and content accuracy updates that were being developed for the primary deployment. Maintaining two divergent frontends would create confusion about which version is authoritative.

---

## [0.1.0] — 2026-03-14

### Initial Release — The Crosswalk Data Model

The initial commit established the core intellectual contribution of this project: a structured mapping between 10 OWASP ASI 2026 risks, 16 NIST 800-53 Rev 5 control families (90 total control references), 4 NIST AI-RMF functions (19 subcategories, 62 total category references), and real-world evidence citations for each risk.

The crosswalk was implemented as a single-page React application with three views: an 800-53 heatmap showing control density per ASI risk per family, an AI-RMF heatmap showing category coverage per ASI risk per function, and an evidence explorer providing full rationale text and incident citations for each mapping.

The data model was designed around the principle that **every mapping must carry a rationale** — not just a control ID, but an explanation of *why* that control mitigates that specific agentic AI risk. This distinguishes the crosswalk from simple lookup tables and makes it useful for auditors who need to justify control selection in their System Security Plans (SSPs) and Plans of Action and Milestones (POA&Ms).

---

## Design Principles

The following principles have guided every change documented above and will continue to guide future development:

**Transparent provenance.** Every editorial judgment is disclosed. Severity ratings are labeled as editorial. Scope exclusions are documented with rationale. The reader should never have to guess whether a data point is authoritative or interpretive.

**Dual-number reporting.** Aggregate statistics are always accompanied by their decomposition. "56 unique controls (90 total mappings)" is more honest than either number alone. Compliance dashboards that show only aggregates invite misinterpretation.

**Acknowledged omissions.** What the crosswalk *excludes* is as important as what it includes. The AT-family scope note in ASI09 and the heatmap scoping disclosure are examples of this principle in practice.

**Rationale-first mappings.** A control ID without a rationale is a compliance checkbox. A control ID with a rationale is a defensible audit position. Every mapping in this crosswalk carries an explanation of *why*, not just *what*.

**Legal clarity.** The AGPL-3.0 license and Terms of Service work together to keep the data open while protecting the developer's ability to operate a hosted service. This dual approach ensures the crosswalk remains a community resource without becoming a free input to proprietary compliance products.

---

*This changelog is maintained by the project contributors. For questions about specific decisions, open an issue referencing the Decision Point number.*
