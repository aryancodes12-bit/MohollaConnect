# LocalConnect (MohallaConnect) — Risk Register
**Systematic Risk Identification, Quantitative Assessment, Mitigation Strategies & Monitoring Cadence**

---

## 1. Executive Summary & Purpose
A **Risk Register** is a critical project governance and risk management artifact used to systematically identify, assess, prioritize, monitor, and mitigate technical, operational, architectural, and security risks throughout the lifecycle of **LocalConnect (MohallaConnect)**. 

In a distributed, polyglot hyperlocal commerce ecosystem that spans transactional e-commerce (Spring Boot), asynchronous machine learning (FastAPI), geospatial mapping (Leaflet/OSM), external business intelligence (Metabase), and cloud Generative AI (Gemini), the Risk Register answers four essential questions:
1. **What can go wrong?** (Risk Description & Vulnerability)
2. **How serious is it?** (Quantitative Impact & Probability Scoring)
3. **What will we do about it?** (Mitigation, Avoidance, or Transfer Strategy)
4. **Who is responsible?** (Risk Ownership & Operational Status)

---

## 2. Risk Level Calculation & Scoring Methodology

Risk magnitude is computed using the standard **$5 \times 5$ Risk Severity Matrix**:

$$\text{Risk Score} = \text{Probability} \times \text{Impact}$$

### Probability Rating (1 to 5)
- **1 — Rare / Very Low**: Unlikely to occur during project lifecycle ($<5\%$ likelihood).
- **2 — Low**: May occur occasionally under unusual conditions ($5\% - 20\%$ likelihood).
- **3 — Medium**: Plausible; expected to occur at least once without controls ($21\% - 50\%$ likelihood).
- **4 — High**: Frequent; likely to occur multiple times ($51\% - 80\%$ likelihood).
- **5 — Very High / Almost Certain**: Bound to occur unless actively mitigated ($>80\%$ likelihood).

### Impact Rating (1 to 5)
- **1 — Negligible**: Minimal friction, zero financial loss, cosmetic UI blemish.
- **2 — Minor**: Slight delay in non-critical workflow, temporary degradation with easy workaround.
- **3 — Moderate**: Functional impairment of a core subsystem, localized data inconsistency, recoverable financial impact.
- **4 — Major**: Substantial disruption of order checkout, significant security vulnerability, potential regulatory breach.
- **5 — Catastrophic**: System-wide downtime, complete data compromise, cryptographic exploit, massive unexpected financial liability.

### Risk Level Categorization
| Risk Score Range | Severity Level | Color Code | Action Required |
|---|---|---|---|
| **1 — 4** | **Low Risk** | 🟢 Green | Routine operational monitoring; accept risk with standard procedures. |
| **5 — 9** | **Medium Risk** | 🟡 Yellow | Specific mitigation controls assigned to engineering lead; periodic review. |
| **10 — 15** | **High Risk** | 🟠 Orange | Proactive architectural intervention required; active tracking in sprint reviews. |
| **16 — 25** | **Critical Risk** | 🔴 Red | Immediate blockers; architectural redesign or emergency mitigation mandatory. |

---

## 3. Risk Response Strategies

1. **Avoid**: Alter the architecture, codebase, or operational plan to eliminate the threat entirely.
2. **Mitigate**: Implement technical controls, defensive programming, automated safeguards, and rate limits to reduce probability or impact.
3. **Transfer**: Shift risk exposure to an external provider (e.g., delegating tile hosting to OpenStreetMap, using managed cloud databases).
4. **Accept**: Formally acknowledge low-severity risks and establish documented contingency workarounds.

---

## 4. Comprehensive Master Risk Register

| Risk ID | Category | Risk Description | Probability (1-5) | Impact (1-5) | Risk Score | Risk Level | Mitigation & Technical Response Strategy | Response Type | Owner | Status |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---|:---:|:---:|:---:|
| **R01** | **Security** | **Insecure Direct Object Reference (IDOR) on Order Tracking**<br>Buyer A inspects or modifies Buyer B's order by guessing or iterating the sequential order ID in `/api/orders/{id}` or via the chatbot. | 4 | 5 | **20** | 🔴 **Critical** | **Enforce Strict Ownership Check**: Validate in `OrderService.java` that `order.getBuyer().getId().equals(currentUser.getId()) || isAdmin`. Replicate identical check in `ChatService.java` before passing order telemetry to the Gemini LLM. | **Avoid** | Backend Lead | **Closed / Verified** |
| **R02** | **Financial** | **Unbounded Gemini API Consumption & Bill Shock**<br>Malicious bots or automated scripts spam `/api/chat` with rapid messages, exhausting Google Cloud quotas and generating runaway API expenses. | 4 | 4 | **16** | 🔴 **Critical** | **In-Memory Sliding-Window Rate Limiter**: Enforce a strict ceiling of 25 messages per 60 seconds per client key (User ID / Client IP) in `ChatService.java`. Return graceful HTTP 429/notice without making remote API calls. | **Mitigate** | Security Lead | **Closed / Verified** |
| **R03** | **Security** | **Exposure of `GEMINI_API_KEY` in Public Repository or Frontend**<br>Accidental leakage of cloud credentials in Git commits or client-side JavaScript bundles, allowing unauthorized third-party usage. | 3 | 5 | **15** | 🟠 **High** | **Confine Secrets to Server**: Keep all LLM calls exclusively on the Spring Boot backend. Use `.gitignore` for `*.env`, `*secret*`, and `gemini_api_key.txt`. Enable GitHub Secret Scanning Push Protection. | **Avoid** | DevOps Lead | **Closed / Verified** |
| **R04** | **Integrity** | **Physical Doorstep Delivery Fraud & False Handover Claims**<br>Delivery driver marks order as delivered without physical handover, or buyer falsely claims non-receipt to reverse payment. | 4 | 4 | **16** | 🔴 **Critical** | **Cryptographic 4-Digit OTP Escrow Handshake**: Generate a random 4-digit code shown exclusively to the buyer upon dispatch. Delivery driver must obtain and input this OTP on arrival; order transitions to `DELIVERED` only on OTP match. | **Avoid** | Product Owner | **Closed / Verified** |
| **R05** | **Security** | **Analytical Queries Compromising Transactional Database (OLTP/OLAP Contention)**<br>Complex statistical ML joins or Metabase SQL queries lock tables, exhausting connection pools and degrading live buyer checkouts. | 3 | 4 | **12** | 🟠 **High** | **Dual-Role PostgreSQL Separation**: Create an unprivileged `analytics_reader` role granted strictly `SELECT` permissions on specific tables. Bind all Python ML services and Metabase connections to this read-only role. | **Avoid** | Database Architect | **Closed / Verified** |
| **R06** | **Performance**| **Simultaneous Stock Depletion Race Conditions**<br>Two buyers purchase the final remaining inventory of an artisan's handcrafted item concurrently, causing negative stock. | 3 | 4 | **12** | 🟠 **High** | **Atomic Inventory Verification**: Execute stock deduction inside an atomic `@Transactional` database boundary with optimistic/pessimistic locking; fail checkout if `stockQty < requestedQty`. | **Mitigate** | Backend Lead | **Closed / Verified** |
| **R07** | **Availability**| **OpenStreetMap Tile Server Rate-Limiting or Outage**<br>Public OpenStreetMap tile server rejects high-volume map tile requests from Bazaar Map users during peak traffic. | 3 | 3 | **9** | 🟡 **Medium** | **Client-Side Tile Caching & Fallback**: Implement Leaflet tile caching in browser cache storage; provide structured list view alongside interactive map if tiles fail to load. | **Transfer** | Frontend Lead | **Open / Monitored** |
| **R08** | **Quality** | **LLM Hallucinations on Platform Rules & Fake Orders**<br>LocalConnect Saathi promises discounts, hallucinates platform policies, or confirms fake orders on behalf of users. | 4 | 3 | **12** | 🟠 **High** | **Strict Grounding System Prompt**: Explicitly instruct model on immutable platform facts (4-digit OTP, real order statuses, no direct order placement). Force structured JSON output (`responseMimeType: application/json`). | **Mitigate** | AI Engineer | **Closed / Verified** |
| **R09** | **Compliance** | **Unverified / Fraudulent Merchant Onboarding**<br>Scammers set up fraudulent storefronts with fictitious products, misleading neighborhood buyers. | 3 | 4 | **12** | 🟠 **High** | **Mandatory Admin KYC Approval Workflow**: New store registrations start in `PENDING` status. Listings are hidden from public map and catalog until reviewed and granted "Verified Mohalla Seller" badge by admin. | **Avoid** | Compliance Lead | **Closed / Verified** |
| **R10** | **Data Loss** | **PostgreSQL Database Storage Failure or Corruption**<br>Host machine crashes or filesystem corruption damages `localconnect_db` tables, resulting in lost order history and user profiles. | 2 | 5 | **10** | 🟠 **High** | **Automated Backups & Volume Snapshots**: Schedule daily automated `pg_dump` backups, export historical data seeders (`DemoDataSeeder.java`), and store database on persistent cloud SSD volumes. | **Mitigate** | System Admin | **Closed / Active** |
| **R11** | **Performance**| **Python Analytics Microservice High Latency on KMeans Clustering**<br>Re-running KMeans clustering across thousands of historical orders on every request degrades API response times. | 3 | 3 | **9** | 🟡 **Medium** | **In-Memory Results Caching**: Cache RFM customer segmentation results with a 15-minute Time-To-Live (TTL); execute clustering asynchronously or on scheduled background cron rather than synchronously per request. | **Mitigate** | ML Engineer | **Closed / Verified** |
| **R12** | **Usability** | **Multilingual Misunderstanding in Regional Queries**<br>AI Assistant fails to interpret colloquial Hinglish phrasing (e.g., *"mera saman kab aayega"*), confusing buyers. | 3 | 3 | **9** | 🟡 **Medium** | **Few-Shot Multilingual Persona Tuning**: Train and prompt Gemini with explicit Hindi/Hinglish dialect examples; enforce auto-script detection so responses match user's native vocabulary without prompts. | **Mitigate** | AI Engineer | **Closed / Verified** |
| **R13** | **Security** | **JWT Token Hijacking & Session Replay**<br>Stolen authentication token allows attackers to impersonate buyers or merchants indefinitely. | 2 | 4 | **8** | 🟡 **Medium** | **Short-Lived Expiration & HTTPS Enforcement**: Set JWT expiration to 24 hours (`86400000ms`); enforce TLS 1.3 encryption across all public endpoints; store tokens securely in memory / secure storage. | **Mitigate** | Security Lead | **Closed / Active** |
| **R14** | **Operational**| **Leaflet Map Pin Misalignment from Geocoding Inaccuracies**<br>Nominatim geocoder returns approximate town center coordinates rather than the artisan's exact home workshop street address. | 3 | 3 | **9** | 🟡 **Medium** | **Interactive Draggable Pin Picker**: Provide a manual draggable map pin in `StoreSettingsPage.jsx` allowing artisans to drag and pinpoint their exact doorstep GPS coordinates with Leaflet marker drag events. | **Mitigate** | Frontend Lead | **Closed / Verified** |
| **R15** | **Usability** | **Storefront UI Contrast Failure on Dark Cards**<br>Applying light border utilities (`foil-border`) overrides dark gradients, causing text to become white-on-white and rendering headers blank. | 3 | 3 | **9** | 🟡 **Medium** | **Design Token Separation**: Create dedicated `.foil-border-indigo` utility preserving dark backgrounds; conduct regression audits with automated browser screenshots. | **Avoid** | UI/UX Lead | **Closed / Verified** |
| **R16** | **Legal** | **Fake or Malicious Product Reviews Damaging Artisan Reputation**<br>Competitors post fabricated negative reviews to harm a local artisan's marketplace ranking. | 3 | 3 | **9** | 🟡 **Medium** | **Verified Buyer Review Gating**: Allow reviews to be posted only by authenticated users who have completed a `DELIVERED` order from that specific store; integrate NLP sentiment filtering to flag anomalies. | **Avoid** | Product Owner | **Closed / Verified** |
| **R17** | **Performance**| **Vite Frontend Large Bundle Size Slowing 3G Mobile Networks**<br>Bundling GSAP, Leaflet, and Metabase assets into a single massive chunk slows down initial page load for rural mobile users. | 3 | 3 | **9** | 🟡 **Medium** | **Dynamic Code-Splitting & Compression**: Implement route-based lazy loading (`React.lazy`), dynamic imports for heavy mapping engines, and Gzip/Brotli compression, keeping initial vendor chunk <400kB. | **Mitigate** | Frontend Lead | **Closed / Verified** |
| **R18** | **Operational**| **Metabase Standalone Process Termination in Production**<br>The background `metabase.jar` process terminates due to JVM OutOfMemoryError, breaking executive dashboards. | 2 | 3 | **6** | 🟡 **Medium** | **Systemd / Daemon Supervisor with Auto-Restart**: Run Metabase under a process supervisor (Systemd / Docker restart: always) with configured `-Xmx1024m` heap memory allocation limits. | **Mitigate** | DevOps Lead | **Closed / Active** |
| **R19** | **Governance** | **Admin Directory Information Overload on Large Scale**<br>Loading all users at once without server-side pagination exhausts browser memory and leaks full user datasets. | 4 | 3 | **12** | 🟠 **High** | **Spring Data Pageable Server Pagination**: Implement `Pageable` in `AdminController.java` with dynamic sorting (`sortBy`, `sortDir`) and SQL `LIMIT/OFFSET`, streaming only 10-20 records per page to the client. | **Avoid** | Backend Lead | **Closed / Verified** |
| **R20** | **Business** | **Local Merchant Adoption Resistance Due to Digital Apprehension**<br>Artisans unaccustomed to computers find digital store management intimidating and abandon the platform. | 4 | 3 | **12** | 🟠 **High** | **Simplification & Assisted Setup**: Streamline product additions to 3 simple inputs (Title, Price, Stock); provide voice-friendly AI assistant (Saathi) to guide onboarding in Hindi. | **Mitigate** | Community Lead | **Open / Ongoing** |

---

## 5. Visual Risk Heatmap Matrix

```
  5 │                  │  [R10]             │  [R03]             │  [R01]             │
    │  Catastrophic    │  DB Failure        │  API Key Leak      │  IDOR Exploit      │
────┼──────────────────┼────────────────────┼────────────────────┼────────────────────┤
  4 │                  │  [R13]             │  [R05] OLAP Cont.  │  [R02] Gemini Cost │
    │  Major           │  JWT Replay        │  [R06] Race Cond.  │  [R04] OTP Fraud   │
    │                  │                    │  [R09] Fake Store  │                    │
────┼──────────────────┼────────────────────┼────────────────────┼────────────────────┤
  3 │                  │  [R18]             │  [R07] OSM Outage  │  [R08] LLM Halluc. │
    │  Moderate        │  Metabase Crash    │  [R11] ML Latency  │  [R19] Admin Memory│
    │                  │                    │  [R14] GPS Drift   │  [R20] Adoption    │
    │                  │                    │  [R15] UI Contrast │                    │
    │                  │                    │  [R16] Fake Review │                    │
    │                  │                    │  [R17] Bundle Size │                    │
────┼──────────────────┼────────────────────┼────────────────────┼────────────────────┤
  2 │                  │                    │  [R12] Dialect NLP │                    │
    │  Minor           │                    │                    │                    │
────┼──────────────────┼────────────────────┼────────────────────┼────────────────────┤
  1 │                  │                    │                    │                    │
    │  Negligible      │                    │                    │                    │
────┴──────────────────┴────────────────────┴────────────────────┴────────────────────┘
         1                    2                    3                    4                    5
      Rare                 Low               Medium               High              Certain
                                      PROBABILITY
```

---

## 6. Deep-Dive Treatment Action Plans for Top Critical Risks

### Action Plan 1: IDOR Prevention on Orders (Risk R01)
- **Root Cause**: Reliance on client-provided IDs without verifying current user session ownership.
- **Technical Action**:
  ```java
  // Enforced in OrderService.java and ChatService.java
  User user = userRepository.findByEmail(auth.getName()).orElseThrow();
  boolean isAuthorized = order.getBuyer().getId().equals(user.getId()) 
      || (order.getProduct().getStore().getOwner().getId().equals(user.getId())) 
      || "ADMIN".equalsIgnoreCase(user.getRole().name());
  
  if (!isAuthorized) {
      throw new AccessDeniedException("Unauthorized order access blocked");
  }
  ```
- **Verification**: Verified via test scripts where Buyer A attempted to query Buyer B's Order #1 in chat and REST API; system strictly returned access denied notice.

### Action Plan 2: Unbounded Gemini API Token Rate Limiting (Risk R02)
- **Root Cause**: Publicly accessible chat endpoints allowing bot traffic to drain cloud API balances.
- **Technical Action**:
  ```java
  // In-Memory Sliding Window in ChatService.java
  private final ConcurrentHashMap<String, Deque<Long>> requestHistory = new ConcurrentHashMap<>();
  private static final int RATE_LIMIT_MAX_REQUESTS = 25;
  private static final long RATE_LIMIT_WINDOW_MS = 60_000;

  private boolean isRateLimited(String clientKey) {
      long now = System.currentTimeMillis();
      Deque<Long> timestamps = requestHistory.computeIfAbsent(clientKey, k -> new ArrayDeque<>());
      synchronized (timestamps) {
          while (!timestamps.isEmpty() && now - timestamps.peekFirst() > RATE_LIMIT_WINDOW_MS) {
              timestamps.pollFirst();
          }
          if (timestamps.size() >= RATE_LIMIT_MAX_REQUESTS) return true;
          timestamps.addLast(now);
          return false;
      }
  }
  ```
- **Verification**: Validated by dispatching 27 rapid requests in a loop; requests 25 and 26 were caught and returned polite rate limit banners without calling Gemini.

### Action Plan 3: Doorstep OTP Handshake Verification (Risk R04)
- **Root Cause**: Moral hazard in hyper-local deliveries leading to disputed fulfillment claims.
- **Technical Action**:
  - The buyer receives a secure, random 4-digit code on their `/orders/:id` page only after the merchant or driver marks the status as `OUT_FOR_DELIVERY`.
  - Delivery driver cannot close the order without entering this 4-digit token.
  - Driver has a maximum of 3 failed attempts before the order locks for safety.

---

## 7. Risk Monitoring Cadence & Governance
- **Weekly Sprint Backlog Triage**: Review all `Open` risks against current sprint tickets.
- **Automated CI/CD Secret Scanning**: Pre-commit hooks and GitHub push protection scanning to detect accidental credential exposure before code merges.
- **Quarterly Threat Modeling**: Re-evaluating the Risk Heatmap Matrix against real-world production telemetry, user growth spikes, and infrastructure scaling metrics.
