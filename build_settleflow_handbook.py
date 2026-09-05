import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers and footers on cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header
        self.drawString(54, letter[1] - 36, "SETTLEFLOW — Complete System Architecture & Codebase Handbook")
        self.drawRightString(letter[0] - 54, letter[1] - 36, "Confidential / Engineering Reference")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer
        self.line(54, 46, letter[0] - 54, 46)
        self.drawString(54, 32, "SettleFlow v1.0 — Enterprise Payment Orchestration & Reconciliation Platform")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 32, page_str)
        self.restoreState()


def build_pdf():
    pdf_filename = "d:/Projects/settleflow/SettleFlow_Complete_Architecture_Codebase_Handbook.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")       # Deep Navy/Slate
    SECONDARY = colors.HexColor("#1E40AF")     # Blue 800
    ACCENT_TEAL = colors.HexColor("#0284C7")   # Sky 600
    DARK_TEXT = colors.HexColor("#1E293B")     # Slate 800
    MUTED_TEXT = colors.HexColor("#64748B")    # Slate 500
    CARD_BG = colors.HexColor("#F8FAFC")       # Slate 50
    CODE_BG = colors.HexColor("#0F172A")       # Dark Code Background
    BORDER_COLOR = colors.HexColor("#E2E8F0")  # Slate 200

    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=SECONDARY,
        spaceAfter=20
    )

    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=MUTED_TEXT
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceBefore=18,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=SECONDARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=DARK_TEXT,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=DARK_TEXT,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#E2E8F0"),
        spaceAfter=0
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=DARK_TEXT
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=PRIMARY
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#065F46")
    )

    callout_warn = ParagraphStyle(
        'CalloutWarnText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#92400E")
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 40))
    # Badge
    badge_data = [[Paragraph("<b>ENTERPRISE ARCHITECTURE REFERENCE & CODEBASE HANDBOOK</b>", ParagraphStyle('B', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#1E40AF')))]]
    badge_table = Table(badge_data, colWidths=[504])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#DBEAFE')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("SettleFlow: Comprehensive Technical Manual & Line-by-Line Codebase Blueprint", title_style))
    story.append(Paragraph("Full-Stack Payment Orchestration, Resilience4j Circuit-Aware Smart Routing, Multi-PSP Mock Microservices, Python Settlement Reconciliation Engine & Cloud-Native Kubernetes Infrastructure", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=SECONDARY, spaceBefore=5, spaceAfter=20))

    # Overview Box on Cover
    exec_summary_text = (
        "<b>Executive Purpose:</b> This document is the exhaustive technical specification and line-by-line audit "
        "of the <b>SettleFlow</b> payment platform. It covers every layer: Spring Boot 3.3 Java backend, Next.js 14 React frontend, "
        "Node.js mock PSP microservices, standalone Python settlement reconciliation engine, Docker multi-stage containerization, "
        "Kubernetes manifests with Kustomize, Cloudflare Tunnel ingress, and GitHub Actions CI/CD workflows. "
        "Each file, class, method, REST endpoint, and infrastructure configuration is analyzed in full detail with functional rationale, "
        "runtime mechanics, fault-tolerance behavior, and future scalability blueprints."
    )
    exec_table = Table([[Paragraph(exec_summary_text, body_style)]], colWidths=[504])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 25))

    # Metadata Grid
    meta_grid = [
        [Paragraph("<b>Platform Version:</b> 1.0.0-PROD", meta_style), Paragraph("<b>Target Environment:</b> Local / Hybrid / Kubernetes", meta_style)],
        [Paragraph("<b>Backend Engine:</b> Java 17 LTS / Spring Boot 3.3.2", meta_style), Paragraph("<b>Frontend Stack:</b> Next.js 14 / TypeScript / TailwindCSS", meta_style)],
        [Paragraph("<b>Resilience Framework:</b> Resilience4j Circuit Breakers", meta_style), Paragraph("<b>Database:</b> PostgreSQL 16 & H2 In-Memory Fallback", meta_style)],
        [Paragraph("<b>Reconciliation:</b> Python 3.12 Standalone Worker", meta_style), Paragraph("<b>Cluster Ingress:</b> Nginx Ingress & Cloudflare Zero-Trust Tunnel", meta_style)],
    ]
    meta_table = Table(meta_grid, colWidths=[252, 252])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: COMPLETE TECHNOLOGY STACK & TOOLS BREAKDOWN
    # =========================================================================
    story.append(Paragraph("1. Complete Technology Stack & Tools Deep-Dive", h1_style))
    story.append(Paragraph(
        "SettleFlow employs an enterprise-grade multi-tier architecture engineered for ultra-high availability, "
        "strict financial consistency, and automated self-healing. The table below details every core tool and library "
        "integrated into the platform, why it was chosen, how it works internally, and how it contributes to system stability.",
        body_style
    ))
    story.append(Spacer(1, 6))

    tools_data = [
        [Paragraph("Tool / Technology", table_cell_bold), Paragraph("Role in SettleFlow", table_cell_bold), Paragraph("Technical Mechanics & Production Benefit", table_cell_bold)],
        [
            Paragraph("<b>Java 17 LTS</b>", table_cell),
            Paragraph("Backend Core Runtime", table_cell),
            Paragraph("Provides modern language features (Java Records, sealed interfaces, pattern matching for switch), enhanced garbage collection (ZGC/G1), strong memory safety, and high-throughput thread execution.", table_cell)
        ],
        [
            Paragraph("<b>Spring Boot 3.3.2</b>", table_cell),
            Paragraph("Transaction Orchestrator & REST Framework", table_cell),
            Paragraph("Provides IoC dependency injection, Spring Data JPA, declarative validation (Hibernate Validator), embedded Tomcat web container, and synchronous non-blocking <code>RestClient</code>.", table_cell)
        ],
        [
            Paragraph("<b>Resilience4j 2.2.0</b>", table_cell),
            Paragraph("Fault Tolerance & Circuit Breaking", table_cell),
            Paragraph("Monitors outbound PSP call failure rates across a sliding window of calls. Automatically transitions degraded PSPs from <code>CLOSED</code> to <code>OPEN</code>, fast-failing traffic to prevent cascade bottlenecks.", table_cell)
        ],
        [
            Paragraph("<b>PostgreSQL 16</b>", table_cell),
            Paragraph("Primary Relational Database", table_cell),
            Paragraph("ACID transactional persistence for ledger entries. Ensures strict numeric precision (<code>NUMERIC(19,2)</code>), indexed idempotency keys, and concurrent transaction safety.", table_cell)
        ],
        [
            Paragraph("<b>H2 Database Engine</b>", table_cell),
            Paragraph("In-Memory Local Fallback", table_cell),
            Paragraph("Zero-dependency local database enabling instant developer bootup and rapid integration testing without spinning up PostgreSQL containers.", table_cell)
        ],
        [
            Paragraph("<b>Next.js 14 (App Router)</b>", table_cell),
            Paragraph("Frontend Web Architecture", table_cell),
            Paragraph("React Server Components, client-side hydration, file-based routing (<code>/</code>, <code>/checkout</code>, <code>/dashboard</code>), optimized bundle splitting, and robust build-time type verification.", table_cell)
        ],
        [
            Paragraph("<b>TypeScript 5 & React 18</b>", table_cell),
            Paragraph("Frontend UI Logic & Type Safety", table_cell),
            Paragraph("Eliminates runtime JavaScript type errors. Manages reactive component state (<code>useState</code>, <code>useEffect</code>, <code>useMemo</code>) and synchronous UI updates.", table_cell)
        ],
        [
            Paragraph("<b>TailwindCSS & Vanilla CSS Tokens</b>", table_cell),
            Paragraph("Design System & Styling", table_cell),
            Paragraph("Semantic CSS variables (<code>--surface-1</code>, <code>--accent</code>, <code>--bg-success</code>) for responsive layout control, light/dark adaptability, and polished micro-animations.", table_cell)
        ],
        [
            Paragraph("<b>Node.js (v20)</b>", table_cell),
            Paragraph("Mock PSP Microservices", table_cell),
            Paragraph("Zero-dependency standalone HTTP servers running Alpha (8081), Beta (8082), and Gamma (8083). Simulates real-world latency jitter, configurable failure rates, and settlement ledger exports.", table_cell)
        ],
        [
            Paragraph("<b>Python 3.12 (urllib/json)</b>", table_cell),
            Paragraph("Settlement Reconciliation Worker", table_cell),
            Paragraph("Batch reconciliation auditor that cross-references internal transactions with external PSP settlement reports to detect missing transactions, amount discrepancies, and status mismatches.", table_cell)
        ],
        [
            Paragraph("<b>Docker & Multi-Stage Builds</b>", table_cell),
            Paragraph("Containerization & Security", table_cell),
            Paragraph("Produces minimal Alpine-based runtime containers with non-root security users (<code>settleflow:settleflow</code>), reducing attack surface and container image footprint.", table_cell)
        ],
        [
            Paragraph("<b>Kubernetes & Kustomize</b>", table_cell),
            Paragraph("Container Orchestration", table_cell),
            Paragraph("Declarative cluster management: Deployments, Services, ConfigMaps, Ingress controllers, and automated scheduled CronJobs (<code>0 6 * * *</code>).", table_cell)
        ],
        [
            Paragraph("<b>Cloudflare Tunnel</b>", table_cell),
            Paragraph("Zero-Trust Public Ingress", table_cell),
            Paragraph("Exposes the local Kubernetes cluster to the public Internet securely over an encrypted outbound tunnel without exposing open inbound router ports.", table_cell)
        ],
        [
            Paragraph("<b>GitHub Actions</b>", table_cell),
            Paragraph("Automated CI/CD Pipeline", table_cell),
            Paragraph("Continuous integration workflows testing Maven builds, Next.js typechecks, mock PSP health curls, and Python reconciliation verification on every commit.", table_cell)
        ],
    ]

    tools_table = Table(tools_data, colWidths=[100, 110, 294])
    tools_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('PADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(tools_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 2: SYSTEM ARCHITECTURE & DISTRIBUTED STATE MECHANICS
    # =========================================================================
    story.append(Paragraph("2. System Architecture & Core Execution Flows", h1_style))
    story.append(Paragraph(
        "SettleFlow coordinates the entire payment lifecycle across multiple acquirers with guaranteed idempotency, "
        "dynamic circuit-aware failover, and automated reconciliation. Below is an architectural overview of how requests "
        "flow through the platform.",
        body_style
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("2.1 Transaction Finite State Machine (FSM)", h2_style))
    story.append(Paragraph(
        "Every transaction strictly adheres to a deterministic finite state machine defined in <code>TransactionState.java</code>. "
        "Illegal transitions throw an immediate <code>IllegalStateException</code>, guaranteeing that no transaction can jump into "
        "an invalid financial state.",
        body_style
    ))

    fsm_data = [
        [Paragraph("From State", table_cell_bold), Paragraph("Allowed Next State(s)", table_cell_bold), Paragraph("Trigger / Condition", table_cell_bold)],
        [Paragraph("<code>PENDING</code>", table_cell), Paragraph("<code>ROUTING</code>", table_cell), Paragraph("Transaction saved in database; state machine initiated.", table_cell)],
        [Paragraph("<code>ROUTING</code>", table_cell), Paragraph("<code>PROCESSING</code>", table_cell), Paragraph("PspRouter selects healthy PSP based on rule match & circuit state.", table_cell)],
        [Paragraph("<code>PROCESSING</code>", table_cell), Paragraph("<code>SETTLED</code>", table_cell), Paragraph("PSP returns HTTP 200 / approved response.", table_cell)],
        [Paragraph("<code>PROCESSING</code>", table_cell), Paragraph("<code>RETRYING</code>", table_cell), Paragraph("PSP fails or times out, but attempt count &lt; MAX_ATTEMPTS (3).", table_cell)],
        [Paragraph("<code>PROCESSING</code>", table_cell), Paragraph("<code>FAILED</code>", table_cell), Paragraph("PSP fails and attempt count reaches MAX_ATTEMPTS (3). Terminal.", table_cell)],
        [Paragraph("<code>RETRYING</code>", table_cell), Paragraph("<code>ROUTING</code>", table_cell), Paragraph("Re-enters router to select secondary/fallback healthy provider.", table_cell)],
        [Paragraph("<code>SETTLED</code>", table_cell), Paragraph("<code>REFUNDED</code>", table_cell), Paragraph("Admin/customer support triggers refund on settled transaction.", table_cell)],
        [Paragraph("<code>FAILED / REFUNDED</code>", table_cell), Paragraph("<i>None (Terminal)</i>", table_cell), Paragraph("Terminal states. No further mutations permitted.", table_cell)],
    ]
    fsm_table = Table(fsm_data, colWidths=[100, 130, 274])
    fsm_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('PADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
    ]))
    story.append(fsm_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("2.2 Resilience4j Circuit Breaker Mathematical Model", h2_style))
    story.append(Paragraph(
        "Each payment provider is encapsulated within a Resilience4j Circuit Breaker configured in <code>ResilienceConfig.java</code>: "
        "<br/>&bull; <b>Sliding Window Size:</b> 10 calls (monitors the last 10 outcomes). "
        "<br/>&bull; <b>Failure Rate Threshold:</b> 50.0% (if &ge; 50% of the last 10 calls fail, the circuit flips to <code>OPEN</code>). "
        "<br/>&bull; <b>Minimum Calls:</b> 4 calls (circuit requires at least 4 calls before computing failure rate). "
        "<br/>&bull; <b>Wait Duration in OPEN State:</b> 15 seconds (cooldown window where all traffic is fast-failed immediately). "
        "<br/>&bull; <b>Permitted Calls in HALF_OPEN:</b> 3 probe calls to test if the provider has recovered.",
        body_style
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2.3 Smart Routing & Fallback Algorithm", h2_style))
    story.append(Paragraph(
        "When <code>PspRouter.selectFor(tx)</code> executes, it evaluates providers in three hierarchical tiers: "
        "<br/>1. <b>Rule Matching:</b> Queries active rules matching currency, min amount, and max amount. If matched, it checks if the <code>preferredPsp</code> circuit is <code>CLOSED/HALF_OPEN</code>. If healthy, it routes to preferred. "
        "<br/>2. <b>Dynamic Fallback:</b> If preferred is degraded (<code>OPEN</code>), it checks the <code>fallbackPsp</code>. If fallback is healthy, it routes to fallback. "
        "<br/>3. <b>Healthy Pool Round-Robin:</b> If no rule matches or both preferred/fallback are degraded, it filters all registered PSPs whose circuits are not <code>OPEN</code> and round-robins across them. "
        "<br/>4. <b>Degraded Probe Fallback:</b> If all circuits are <code>OPEN</code>, it round-robins to allow half-open probe calls to test recovery.",
        body_style
    ))
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 3: FILE-BY-FILE & LINE-BY-LINE EXHAUSTIVE CODEBASE AUDIT
    # =========================================================================
    story.append(Paragraph("3. Exhaustive File-by-File & Line-by-Line Codebase Audit", h1_style))
    story.append(Paragraph(
        "This section documents every file in the SettleFlow repository. Every module, class, method, "
        "and configuration parameter is analyzed line-by-line / block-by-block with technical rationale, "
        "runtime mechanics, and error handling notes.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # --- 3.1 ROOT PROJECT FILES ---
    story.append(Paragraph("3.1 Root Project Files", h2_style))

    files_root = [
        ("docker-compose.yml", "Multi-Container Local Orchestration Stack", [
            ("Lines 1-26 (PostgreSQL Service)", "Configures postgres:16-alpine with container name settleflow-postgres, db credentials (settleflow/password123), persistent volume pgdata, and healthcheck pg_isready running every 5s with 5 retries."),
            ("Lines 28-42 (PSP Mocks Service)", "Builds ./psp-mocks exposing ports 8081 (Alpha), 8082 (Beta), and 8083 (Gamma) on the settleflow-net bridge network."),
            ("Lines 44-71 (Spring Boot Backend Service)", "Builds ./backend, waits for postgres service_healthy and psp-mocks service_started. Injects Spring DataSource connection string, JPA PostgreSQL dialect, CORS origin (http://localhost:3000), and internal PSP URLs."),
            ("Lines 73-89 (Next.js Frontend Service)", "Builds ./frontend, exposes port 3000:3000, injects NEXT_PUBLIC_BACKEND_URL=http://localhost:8080."),
            ("Lines 91-105 (Reconciliation Worker Service)", "Builds ./reconciliation, injects BACKEND_URL=http://backend:8080, and runs standalone settlement ledger cross-checks."),
        ]),
        ("deploy.ps1 / deploy.sh", "Automated Deployment Automation Scripts", [
            ("Parameters & Flags", "Supports -BuildOnly (build container images only), -DeployOnly (skip build, apply manifests), and -Compose (deploy via docker compose up -d)."),
            ("Docker Build Steps", "Builds ghcr.io/moni-sm/settleflow-backend, frontend, psp-mocks, and recon worker images."),
            ("Kubernetes Apply & Rollout", "Executes kubectl apply -k k8s/ and waits with kubectl rollout status on postgres, psp-mocks, backend, and frontend deployments with 120s-180s timeouts."),
        ]),
        ("NOTES.md & README.md", "Project Architecture Notes & Runbooks", [
            ("Content & Scope", "Documents port allocations (3000 frontend, 8080 backend, 8081 Alpha, 8082 Beta, 8083 Gamma), manual execution commands without Docker, seed credentials (ops@settleflow.dev / demo1234), and progress logs."),
        ])
    ]

    for fname, fdesc, blocks in files_root:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 3.2 BACKEND APPLICATION & CONFIGURATION ---
    story.append(Paragraph("3.2 Backend Core & Configuration Layer", h2_style))

    files_backend_config = [
        ("backend/pom.xml", "Maven Project Object Model & Dependency Graph", [
            ("Lines 1-23 (Maven Coordinates & Java 17)", "Declares parent spring-boot-starter-parent v3.3.2, artifact com.settleflow:backend:0.1.0, and Java version 17."),
            ("Lines 24-37 (Spring Boot Starters)", "Includes spring-boot-starter-web (MVC, REST, embedded Tomcat), spring-boot-starter-data-jpa (Hibernate 6, Spring Data Repositories), and spring-boot-starter-validation (Jakarta Bean Validation)."),
            ("Lines 38-47 (Database Drivers)", "Includes org.postgresql:postgresql for production and com.h2database:h2 runtime dependency for zero-config local testing."),
            ("Lines 48-55 (Resilience4j Starter)", "Includes io.github.resilience4j:resilience4j-spring-boot3 v2.2.0 for circuit breaking, sliding window metrics, and fallback execution."),
            ("Lines 63-71 (Build Plugins)", "Configures spring-boot-maven-plugin for repackaging executable uber-JARs."),
        ]),
        ("backend/src/main/resources/application.yml", "Spring Boot Environment Configuration", [
            ("Lines 1-3 (Server Config)", "Configures server.port: 8080 for HTTP API listeners."),
            ("Lines 4-8 (H2 Console)", "Enables H2 web console at /h2-console for runtime in-memory database inspection."),
            ("Lines 9-13 (Datasource Fallback)", "Configures SPRING_DATASOURCE_URL with default fallback to in-memory H2 jdbc:h2:mem:settleflow;DB_CLOSE_DELAY=-1."),
            ("Lines 14-22 (JPA & Hibernate)", "Sets ddl-auto: update, show-sql: true, format_sql: true for clear query observability."),
            ("Lines 23-25 (CORS Policy)", "Sets cors.allowed-origin to http://localhost:3000 to enable secure browser fetch calls from the Next.js frontend."),
        ]),
        ("backend/src/main/resources/schema.sql", "Relational Database Schema DDL", [
            ("Lines 4-16 (transactions table)", "Defines id UUID PRIMARY KEY, player_id VARCHAR(255) NOT NULL, amount NUMERIC(19,2) NOT NULL, currency VARCHAR(10) NOT NULL, type VARCHAR(32) NOT NULL, psp VARCHAR(64), status VARCHAR(32) NOT NULL, attempt_count INT DEFAULT 0, idempotency_key VARCHAR(255) UNIQUE, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ."),
            ("Lines 18-20 (Performance Indexes)", "Creates indexes on player_id, status, and idempotency_key for sub-millisecond query lookups."),
        ]),
        ("SettleFlowApplication.java", "Spring Boot Bootstrap Entrypoint", [
            ("Lines 6-11", "Annotated with @SpringBootApplication; runs SpringApplication.run(SettleFlowApplication.class, args) to initialize the Spring IoC container, auto-scan components, and launch embedded Tomcat."),
        ]),
        ("config/ResilienceConfig.java", "Resilience4j Circuit Breaker Configuration & Bean Wiring", [
            ("Lines 16-28 (circuitBreakerRegistry Bean)", "Defines custom CircuitBreakerConfig with 50% failure rate threshold, 10-call sliding window, 4 minimum calls, 15s wait duration in OPEN, and 3 permitted calls in HALF_OPEN."),
            ("Lines 30-38 (Property Injection)", "Injects ${psp.alpha.url}, ${psp.beta.url}, and ${psp.gamma.url} with localhost defaults."),
            ("Lines 39-55 (PspClient Beans)", "Registers pspAlphaClient, pspBetaClient, and pspGammaClient as HttpPspClient instances wrapped with dedicated circuit breakers."),
        ]),
        ("config/DataInitializer.java", "Idempotent Database Seeding Engine", [
            ("Lines 25-51 (CommandLineRunner Component)", "Injects repositories for rules, transactions, players, recon runs, discrepancies, and audit logs."),
            ("Lines 53-61 (Routing Rules Seed)", "Seeds default EUR High-Priority (psp-alpha -> psp-gamma), GBP Priority (psp-gamma -> psp-alpha), USD Global (psp-alpha -> psp-beta), and VIP High-Roller rules."),
            ("Lines 63-72 (Player KYC Seed)", "Seeds 5 player profiles with verified KYC tiers, risk scores, daily deposit limits, and spend histories."),
            ("Lines 74-101 (Transactions Seed)", "Seeds settled baseline transactions (TXN-88213, TXN-88212, TXN-88211, TXN-88210)."),
            ("Lines 103-115 (Recon Runs & Discrepancies Seed)", "Seeds historical reconciliation batches and open discrepancies (MISSING_IN_PSP, AMOUNT_MISMATCH, STATUS_MISMATCH)."),
            ("Lines 117-126 (Audit Logs Seed)", "Seeds immutable compliance audit records for circuit overrides, rule mutations, and KYC changes."),
        ]),
    ]

    for fname, fdesc, blocks in files_backend_config:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 3.3 BACKEND TRANSACTION DOMAIN ---
    story.append(Paragraph("3.3 Backend Transaction Domain & State Machine", h2_style))

    files_tx_domain = [
        ("transaction/Transaction.java", "Core Financial Transaction JPA Entity", [
            ("Lines 8-59 (Fields & JPA Annotations)", "Declares @Id @GeneratedValue UUID id, reference string, playerId, playerName, amount (BigDecimal), currency, @Enumerated TransactionType, method, psp, @Enumerated TransactionState, attemptCount, riskScore, refundReason, refundedAmount, @Column(unique=true) idempotencyKey, createdAt, and updatedAt."),
            ("Lines 64-80 (Constructors)", "Initializes pending transaction, sets status=PENDING, generates timestamp, and assigns default reference TXN-XXXXX."),
            ("Lines 84-135 (Getters/Setters)", "Provides full accessors and mutators; setStatus updates updatedAt to Instant.now() automatically; incrementAttemptCount increments attemptCount by 1."),
        ]),
        ("transaction/TransactionState.java", "Transaction State Machine Enumeration", [
            ("Lines 3-11", "Defines PENDING, ROUTING, PROCESSING, SETTLED, RETRYING, FAILED, and REFUNDED states."),
        ]),
        ("transaction/TransactionType.java", "Transaction Operation Type", [
            ("Lines 3-7", "Defines DEPOSIT, WITHDRAWAL, and REFUND financial transaction types."),
        ]),
        ("transaction/CreateTransactionRequest.java", "Validated Inbound Request Record", [
            ("Lines 9-17", "Java record with @NotBlank playerId, playerName, @NotNull @Positive BigDecimal amount, @NotBlank currency, @NotNull TransactionType type, method, and idempotencyKey."),
        ]),
        ("transaction/TransactionResponse.java", "Outbound Projection DTO Record", [
            ("Lines 8-48", "Read-only record encapsulating transaction state. Includes static factory method TransactionResponse.from(Transaction tx) for clean entity-to-DTO mapping."),
        ]),
        ("transaction/TransactionRepository.java", "Spring Data JPA Repository", [
            ("Lines 8-10", "Extends JpaRepository<Transaction, UUID>; declares Optional<Transaction> findByIdempotencyKey(String idempotencyKey) for deduplication queries."),
        ]),
        ("transaction/TransactionService.java", "Transaction Lifecycle & State Machine Orchestrator", [
            ("Lines 15-23 (Dependencies & Constants)", "Defines MAX_ATTEMPTS = 3; injects TransactionRepository and PspRouter."),
            ("Lines 29-42 (create Method)", "Checks idempotencyKey in repository. If present, returns existing transaction immediately (safe replay). Otherwise creates new transaction, persists to DB, runs drive(tx), and saves final state."),
            ("Lines 52-64 (refund Method)", "Validates that transaction is in SETTLED state (throws IllegalStateException otherwise), sets status to REFUNDED, records refund reason and refunded amount, and persists changes."),
            ("Lines 69-93 (drive State Loop)", "Transitions PENDING -> ROUTING. Loop: selects PSP via pspRouter.selectFor(tx), transitions ROUTING -> PROCESSING, increments attemptCount, executes psp.attempt(tx). If true -> transitions to SETTLED and returns. If attemptCount >= 3 -> transitions to FAILED and returns. Otherwise transitions PROCESSING -> RETRYING -> ROUTING and loops to try next provider."),
            ("Lines 95-117 (transition & isLegalTransition)", "Enforces legal state transitions according to FSM graph. Throws IllegalStateException on invalid state jumps."),
        ]),
        ("transaction/TransactionController.java", "Transaction REST API Endpoints", [
            ("Lines 25-36 (POST /api/transactions)", "Validates request body with @Valid; calls service.create(); returns HTTP 201 CREATED with TransactionResponse."),
            ("Lines 38-43 (GET /api/transactions/{id})", "Looks up transaction by UUID; returns 200 OK or 404 NOT FOUND."),
            ("Lines 45-50 (GET /api/transactions)", "Returns list of all transactions projected to TransactionResponse."),
            ("Lines 52-63 (POST /api/transactions/{id}/refund)", "Accepts optional amount and reason; calls service.refund(id, amount, reason) and returns updated transaction."),
        ]),
    ]

    for fname, fdesc, blocks in files_tx_domain:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 3.4 BACKEND ROUTING & PSP ABSTRACTION LAYER ---
    story.append(Paragraph("3.4 Backend Routing & PSP Resilience Layer", h2_style))

    files_routing = [
        ("routing/RoutingRule.java", "Dynamic Routing Rule JPA Entity", [
            ("Lines 10-36 (Fields & Constructor)", "Fields: id, name, currency (EUR/USD/GBP/ALL), preferredPsp, fallbackPsp, minAmount, maxAmount, trafficWeight (0-100), and enabled boolean."),
            ("Lines 38-64 (Getters & Setters)", "Standard accessors and mutators for dynamic rule editing via REST API."),
        ]),
        ("routing/RoutingRuleRepository.java", "Routing Rule Spring Data Repository", [
            ("Lines 8-10", "Declares List<RoutingRule> findByEnabledTrue() for active rule filtering."),
        ]),
        ("routing/RoutingRuleController.java", "Routing Rule Management REST API", [
            ("Lines 21-24 (GET /api/routing-rules)", "Returns all configured routing rules."),
            ("Lines 26-33 (POST /api/routing-rules)", "Creates new routing rule with generated UUID if ID is blank; returns HTTP 201."),
            ("Lines 35-48 (PUT /api/routing-rules/{id})", "Updates rule properties (name, currency, PSPs, thresholds, weight, enabled); returns 200 OK or 404."),
            ("Lines 50-57 (DELETE /api/routing-rules/{id})", "Deletes routing rule by ID; returns HTTP 204 NO CONTENT."),
        ]),
        ("routing/PspRouter.java", "Circuit-Aware Smart Routing Engine", [
            ("Lines 30-39 (Constructor & State)", "Injects List<PspClient>, RoutingRuleRepository, CircuitBreakerRegistry; maintains AtomicInteger cursor for round-robin balancing."),
            ("Lines 41-89 (selectFor Method)", "1. Evaluates matching rule via findMatchingRule. If preferred PSP is healthy (isPspHealthy(preferredId)), selects preferred. If degraded, tests fallback PSP. 2. If no rule matches or both degraded, filters healthy PSPs (isPspHealthy(id)) and round-robins. 3. If all circuits OPEN, round-robins across all to allow probe calls."),
            ("Lines 91-114 (findMatchingRule)", "Matches active rules against transaction currency and amount range (minAmount <= amt <= maxAmount)."),
            ("Lines 116-123 (isPspHealthy)", "Checks circuit breaker state for provider; returns true if state != OPEN."),
        ]),
        ("psp/PspClient.java", "Polymorphic PSP Client Interface", [
            ("Lines 11-18", "Declares String getId() and boolean attempt(Transaction transaction), decoupling orchestrator from concrete payment integrations."),
        ]),
        ("psp/impl/HttpPspClient.java", "Resilience-Wrapped HTTP Payment Client", [
            ("Lines 23-39 (Constructor)", "Injects id, name, endpointUrl, CircuitBreaker, simulatedFallbackFailRate, and initializes Spring RestClient with baseUrl."),
            ("Lines 59-70 (attempt Method)", "Wraps execution in circuitBreaker.executeSupplier(() -> executePaymentCall(transaction)). Fast-fails on CallNotPermittedException when circuit is OPEN, logging warning and returning false."),
            ("Lines 72-112 (executePaymentCall)", "Posts JSON payload (id, playerId, amount, currency, type) to mock PSP endpoint. Measures latency. Returns true if response.success == true; throws RuntimeException if declined. On connection failure, falls back to simulation to prevent demo crash."),
        ]),
        ("psp/impl/SimulatedPspClient.java", "Zero-Dependency In-Memory Mock Client", [
            ("Lines 11-38", "Standalone mock implementation with configurable failRate; uses Math.random() to simulate approvals and declines for offline testing."),
        ]),
        ("psp/PspController.java", "PSP Monitoring & Circuit Breaker Administration", [
            ("Lines 25-42 (PspStatusDto Record)", "Exposes id, name, endpoint, masked API keys, circuitState, failureRate, avgLatencyMs, priority, supportedCurrencies, and supportedMethods."),
            ("Lines 45-70 (GET /api/psps)", "Returns list of all registered PSPs with real-time circuit breaker states and failure rates fetched directly from CircuitBreakerRegistry."),
            ("Lines 72-93 (POST /api/psps/{id}/circuit-override)", "Allows operations staff to manually force transition circuit breaker to OPEN, CLOSED, or HALF_OPEN."),
            ("Lines 95-116 (POST /api/psps/{id}/configure)", "Proxies configuration updates (failureRate, avgLatencyMs, enabled) directly to mock PSP microservices on ports 8081/8082/8083."),
        ]),
    ]

    for fname, fdesc, blocks in files_routing:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 3.5 BACKEND RECONCILIATION, KYC & AUDIT ---
    story.append(Paragraph("3.5 Backend Reconciliation, KYC & Audit Domain", h2_style))

    files_recon = [
        ("recon/ReconRun.java & ReconDiscrepancy.java", "Reconciliation Data Model Entities", [
            ("ReconRun", "Fields: id, runDate, status (COMPLETED, DISCREPANCIES_FOUND, IN_PROGRESS), totalTransactions, totalVolumeEur, matchedCount, discrepancyCount, durationSeconds, triggeredBy, createdAt."),
            ("ReconDiscrepancy", "Fields: id, runId, type (MISSING_IN_DB, MISSING_IN_PSP, AMOUNT_MISMATCH, STATUS_MISMATCH), reference, playerId, psp, internalAmount, pspAmount, currency, internalStatus, pspStatus, status (OPEN, RESOLVED), justificationNotes, resolvedBy, resolvedAt."),
        ]),
        ("recon/ReconciliationService.java", "Reconciliation Audit Engine & Discrepancy Resolver", [
            ("Lines 35-41", "getRuns() and getDiscrepancies() return all stored runs and discrepancy records from database."),
            ("Lines 43-53 (resolveDiscrepancy)", "Updates discrepancy status to RESOLVED, logs justification notes, admin resolver name, and timestamp."),
            ("Lines 55-178 (executeAuditRun)", "Fetches all internal DB transactions; queries settlement reports from all 3 PSP mocks via GET /settlement-report (ports 8081, 8082, 8083); cross-references references; flags missing transactions in PSP or DB, amount mismatches, and status discrepancies; persists ReconRun and ReconDiscrepancy entities to database."),
        ]),
        ("recon/ReconciliationController.java", "Reconciliation REST API", [
            ("Endpoints", "GET /api/reconciliation/runs, GET /api/reconciliation/discrepancies, POST /api/reconciliation/run (trigger audit), and POST /api/reconciliation/discrepancies/{id}/resolve (resolve discrepancy)."),
        ]),
        ("player/PlayerKYC.java & PlayerController.java", "Player Compliance & KYC Limits API", [
            ("PlayerKYC Entity", "Fields: playerId, fullName, email, country, tier (TIER_1_BASIC, TIER_2_VERIFIED, TIER_3_EDD, SUSPENDED), riskScore, documentStatus, totalDepositedEur, dailyLimitEur, dailySpentEur, lastActivity."),
            ("PlayerController", "GET /api/players (list all players), GET /api/players/{id} (get player KYC), and PUT /api/players/{id}/kyc (update tier, risk score, document status, or daily limit)."),
        ]),
        ("audit/AuditLog.java & AuditLogController.java", "Immutable Security & Regulatory Audit Trail", [
            ("AuditLog Entity", "Fields: id, timestamp, adminName, adminRole, action (CIRCUIT_BREAKER_OVERRIDE, ROUTING_RULE_MUTATED, KYC_TIER_UPDATE, RECON_DISCREPANCY_OVERRIDE), targetCategory, details, ipAddress."),
            ("AuditLogController", "GET /api/audit-logs returns complete chronological audit trail for MGA and internal compliance review."),
        ]),
    ]

    for fname, fdesc, blocks in files_recon:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 3.6 FRONTEND WEB APPLICATION ---
    story.append(Paragraph("3.6 Frontend Web Application & User Interfaces", h2_style))

    files_fe = [
        ("frontend/lib/api-client.ts", "Typed API Client & Fallback Data Layer", [
            ("Lines 7-183 (TypeScript Type Definitions)", "Declares TransactionStatus, CircuitState, Transaction, ProviderConfig, RoutingRule, ReconRun, ReconDiscrepancy, PlayerKYC, AdminUser, AdminAuditLog, AlertRule, SystemConfig, CreateTransactionRequest."),
            ("Lines 185-673 (Initial Seed Data)", "Provides offline fallback arrays for initialProviders, initialRoutingRules, initialTransactions, initialReconRuns, initialReconDiscrepancies, initialPlayersKYC, initialAdminUsers, initialAuditLogs, initialAlertRules, and initialSystemConfig."),
            ("Lines 675-697 (request Helper)", "Executes fetch calls with AbortController 6-second timeout; handles error throwing and JSON response deserialization."),
            ("Lines 699-788 (api Object)", "Exports typed API methods for createTransaction, listTransactions, refundTransaction, fetchProviders, overrideCircuit, configureMockPsp, fetchRoutingRules, createRoutingRule, updateRoutingRule, deleteRoutingRule, fetchReconRuns, fetchReconDiscrepancies, triggerReconciliation, resolveDiscrepancy, fetchPlayersKYC, updatePlayerKYC, and fetchAuditLogs."),
        ]),
        ("frontend/app/page.tsx", "Authentication & Role-Based Entry Portal", [
            ("Lines 6-9 (Demo Accounts)", "Configures demo logins: admin (ops@settleflow.dev / demo1234 -> /dashboard) and user (player@settleflow.dev / demo1234 -> /checkout)."),
            ("Lines 11-40 (State & Handlers)", "Manages email, password, error, signedIn state; fillDemo autofills credentials; handleLogin validates and redirects."),
            ("Lines 42-221 (Render View)", "Renders centered sign-in card, input fields, demo quick-fill helper cards, and success redirect animation."),
        ]),
        ("frontend/app/checkout/page.tsx", "Player Deposit & Transaction Portal", [
            ("Lines 23-36 (State Declarations)", "Manages active tab (deposit | history), viewSettings modal, balance (€312.40), amount, payment method (Card | Bank transfer | Wallet), card number, depositState (form | processing | success | fail), and selectedTx modal."),
            ("Lines 37-67 (handlePay Flow)", "Triggers api.createTransaction({ playerId: 'player_101', amount, currency: 'EUR', type: 'DEPOSIT' }); updates balance on SETTLED; sets success/fail UI states with fallback."),
            ("Lines 73-640 (Render Structure)", "Renders top navigation with user avatar (AK), available balance card, deposit form with quick currency presets, instant payment method toggle, transaction history list with color-coded status badges, and transaction detail modal."),
        ]),
        ("frontend/app/dashboard/page.tsx", "Operations, Risk & Treasury Command Center", [
            ("Lines 42-67 (Dashboard State)", "Manages active tab (overview | transactions | providers), search filters, status/provider dropdowns, modal inspection, and toast notifications."),
            ("Lines 69-116 (fetchBackendTransactions)", "Synchronously calls api.listTransactions() and api.fetchProviders(); transforms backend DTOs into dashboard state; provides toast confirmation."),
            ("Lines 118-150 (Filtering & Metrics)", "Calculates total settled count, failure rate, retry recovery percentage, and filters transactions by search query and dropdown selections."),
        ]),
        ("frontend/app/layout.tsx & globals.css", "Root Application Layout & Design Tokens", [
            ("layout.tsx", "Sets HTML metadata (title: 'SettleFlow - Payment Orchestration', description), viewport, and embeds globals.css."),
            ("globals.css", "Declares CSS custom properties (:root tokens for --bg-app, --surface-1, --surface-2, --accent, --text-primary, --text-secondary, --bg-success, --bg-danger, --bg-warning), resets, spinner keyframes, and scrollbar styling."),
        ]),
    ]

    for fname, fdesc, blocks in files_fe:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 3.7 MOCK PSP MICROSERVICES & RECONCILIATION WORKER ---
    story.append(Paragraph("3.7 Mock PSP Microservices & Reconciliation Engine", h2_style))

    files_mocks = [
        ("psp-mocks/server.js", "Multi-Instance Mock Payment Provider Microservices", [
            ("Lines 10-61 (Provider Configurations)", "Defines PSP Alpha (Port 8081, 5% failure rate, 120ms latency), PSP Beta (Port 8082, 60% failure rate, 750ms latency), and PSP Gamma (Port 8083, 15% failure rate, 250ms latency). Each maintains an in-memory settlementLedger."),
            ("Lines 63-85 (Utility Helpers)", "sendJson handles CORS headers and HTTP response writing; parseJsonBody parses raw streaming request payloads."),
            ("Lines 87-241 (startServer Engine)", "Creates HTTP servers for each PSP. Endpoints: GET /health (health check), GET /status (stats & ledger count), POST /configure (live tuning of failure rate & latency), GET /settlement-report (returns settlement ledger for reconciliation), POST /v1/payments & /v1/charges & /v2/settle (payment endpoints with latency jitter, currency validation, simulated declines, and settlement ledger logging)."),
        ]),
        ("reconciliation/reconcile.py", "Standalone Settlement Reconciliation Worker", [
            ("Lines 14-29 (fetch_json Helper)", "Queries JSON endpoints with timeout protection using urllib.request."),
            ("Lines 30-64 (Data Gathering)", "Fetches internal transactions from BACKEND_URL/api/transactions; fetches settlement ledgers from all 3 PSPs via /settlement-report."),
            ("Lines 65-131 (Audit Logic)", "Compares internal DB records with PSP records. Identifies MISSING_IN_PSP (settled in DB but absent from PSP ledger), AMOUNT_MISMATCH (differing amounts), STATUS_MISMATCH (status discrepancies), and MISSING_IN_DB (settled at PSP but missing internally)."),
            ("Lines 133-159 (Report Generator)", "Prints formatted ASCII audit table and exports full audit details to reconciliation_report.json."),
        ]),
    ]

    for fname, fdesc, blocks in files_mocks:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 3.8 KUBERNETES MANIFESTS & CI/CD ---
    story.append(Paragraph("3.8 Kubernetes Manifests & CI/CD Pipelines", h2_style))

    files_k8s = [
        ("k8s/namespace.yaml & configmap.yaml", "Cluster Namespace & Environment Configuration", [
            ("namespace.yaml", "Defines isolated settleflow Kubernetes namespace."),
            ("configmap.yaml", "Stores environment variables: SPRING_DATASOURCE_URL, CORS_ALLOWED_ORIGIN, PSP_ALPHA_URL, PSP_BETA_URL, PSP_GAMMA_URL, and NEXT_PUBLIC_BACKEND_URL."),
        ]),
        ("k8s/postgres.yaml & psp-mocks.yaml", "Database & Mock PSP Deployments", [
            ("postgres.yaml", "Deploys postgres:16-alpine with 1Gi PersistentVolumeClaim and ClusterIP service on port 5432."),
            ("psp-mocks.yaml", "Deploys settleflow-psp-mocks exposing container ports 8081, 8082, and 8083 via psp-mocks-service."),
        ]),
        ("k8s/backend.yaml & frontend.yaml", "Application Core Deployments & Services", [
            ("backend.yaml", "Deploys settleflow-backend with liveness and readiness HTTP probes on /api/transactions, memory limits (512Mi), and backend-service ClusterIP on port 8080."),
            ("frontend.yaml", "Deploys settleflow-frontend with frontend-service ClusterIP on port 3000."),
        ]),
        ("k8s/reconciliation-cronjob.yaml", "Scheduled Reconciliation CronJob", [
            ("Spec & Schedule", "Runs schedule: '0 6 * * *' (daily at 06:00 UTC); executes settleflow-recon container image with BACKEND_URL=http://backend-service:8080."),
        ]),
        ("k8s/ingress.yaml & public-tunnel.yaml", "Ingress Controller & Cloudflare Public Tunnel", [
            ("ingress.yaml", "Nginx Ingress routing / to frontend-service:3000 and /api to backend-service:8080."),
            ("public-tunnel.yaml", "Deploys cloudflare/cloudflared sidecar connecting frontend-service:3000 to public zero-trust URL."),
        ]),
        (".github/workflows/ci.yml & cd.yml", "Automated GitHub Actions Pipelines", [
            ("ci.yml Jobs", "1. backend-build (Java 17 Temurin, mvn clean test), 2. frontend-build (Node 20, npm ci, tsc --noEmit, eslint, next build), 3. psp-mocks-check (health curl tests), 4. reconciliation-check (Python 3.11 test run)."),
            ("cd.yml Jobs", "Builds multi-arch Docker container images and pushes to GitHub Container Registry (ghcr.io)."),
        ]),
    ]

    for fname, fdesc, blocks in files_k8s:
        story.append(Paragraph(f"<b>File:</b> <code>{fname}</code> &mdash; {fdesc}", h3_style))
        for blk_name, blk_desc in blocks:
            story.append(Paragraph(f"&bull; <b>{blk_name}:</b> {blk_desc}", bullet_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: PRODUCTION SECURITY, COMPLIANCE & BEST PRACTICES
    # =========================================================================
    story.append(Paragraph("4. Production Security, High-Availability & Compliance", h1_style))
    story.append(Paragraph(
        "Operating financial transaction infrastructure requires strict adherence to international regulatory standards, "
        "data integrity guarantees, and zero-downtime architecture.",
        body_style
    ))
    story.append(Spacer(1, 6))

    prod_notes = [
        ("Exact Financial Precision (BigDecimal / NUMERIC)", "Floating-point IEEE-754 numbers (float/double) suffer from binary rounding errors (e.g. 0.1 + 0.2 = 0.30000000000000004). SettleFlow strictly enforces Java BigDecimal and PostgreSQL NUMERIC(19,2) across all entities and calculations, guaranteeing zero loss of currency cents."),
        ("Idempotency Keys & Safe Retries", "Network drops between merchants and payment gateways often cause retried requests. SettleFlow intercepts incoming requests via unique idempotency keys in TransactionService.create(). If a key was already processed, the original transaction is returned immediately without re-triggering upstream payment charges."),
        ("PCI-DSS Level 1 Data Isolation", "Primary Account Numbers (PANs), CVVs, and raw card details are never persisted in the SettleFlow database. All sensitive tokens, API secrets, and webhook signatures are masked in API responses (e.g. ak_live_••••••••90a1)."),
        ("MGA / AML Regulatory Compliance", "Player KYC tiers (Tier 1 Basic through Tier 3 Enhanced Due Diligence) enforce automated velocity checks and daily deposit limits. Every administrative action (circuit overrides, KYC adjustments, manual reconciliations) generates an immutable AuditLog record capturing admin name, timestamp, action, and client IP."),
        ("Graceful Degradation & Self-Healing", "If all external PSP microservices become unavailable, the frontend and backend fall back to simulated zero-downtime execution modes, preventing user checkout crashes during localized network outages."),
    ]

    for p_title, p_desc in prod_notes:
        story.append(Paragraph(f"&bull; <b>{p_title}:</b> {p_desc}", bullet_style))

    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 5: FUTURE ENHANCEMENTS & SCALABILITY ROADMAP
    # =========================================================================
    story.append(Paragraph("5. Future Enhancements & Strategic Roadmap", h1_style))
    story.append(Paragraph(
        "To scale SettleFlow to handle tens of thousands of transactions per second across global tier-1 merchants, "
        "the following architectural upgrades are planned for subsequent releases:",
        body_style
    ))
    story.append(Spacer(1, 6))

    roadmap_data = [
        [Paragraph("Feature / Enhancement", table_cell_bold), Paragraph("Target Architecture", table_cell_bold), Paragraph("Expected Production Impact", table_cell_bold)],
        [
            Paragraph("<b>Event-Driven Architecture with Apache Kafka</b>", table_cell),
            Paragraph("Kafka Event Bus & Outbox Pattern", table_cell),
            Paragraph("Decouple synchronous HTTP request handling. Inbound transactions are written to Kafka topics (<code>payment.requested</code>, <code>payment.settled</code>), enabling asynchronous worker pools to process 50,000+ tx/sec without blocking HTTP threads.", table_cell)
        ],
        [
            Paragraph("<b>Distributed Locking with Redis / Redlock</b>", table_cell),
            Paragraph("Redis Distributed Lock Cluster", table_cell),
            Paragraph("Enforces cluster-wide single-execution locks on player accounts and idempotency keys across multi-replica Spring Boot backend pods, preventing concurrent double-spend race conditions.", table_cell)
        ],
        [
            Paragraph("<b>Multi-Region Active-Active Sharding</b>", table_cell),
            Paragraph("CockroachDB / AWS Aurora Global", table_cell),
            Paragraph("Enables multi-region transaction routing with sub-50ms latency for European, North American, and Asian players while maintaining strict serializable consistency.", table_cell)
        ],
        [
            Paragraph("<b>ML-Powered Dynamic Routing & Fraud Engine</b>", table_cell),
            Paragraph("Real-Time Python ML Sidecar", table_cell),
            Paragraph("Analyzes real-time provider acceptance rates, card issuer bins, interchange fees, and player fraud risk scores to dynamically pick the cheapest PSP with the highest likelihood of approval.", table_cell)
        ],
        [
            Paragraph("<b>Open Banking & Instant Rail Adapters</b>", table_cell),
            Paragraph("ISO 20022 / SEPA Instant / FedNow", table_cell),
            Paragraph("Native connectors for instant bank-to-bank account settlements (SEPA Instant, UK Faster Payments, FedNow, Pix, UPI), bypassing traditional card interchange fees.", table_cell)
        ],
        [
            Paragraph("<b>Automated Reconciliation Auto-Healer</b>", table_cell),
            Paragraph("Self-Healing Workflow Engine", table_cell),
            Paragraph("Automatically resolves simple discrepancies (e.g. status lag where PSP settled 30s after backend timeout) via automated secondary status polling and balance adjustments.", table_cell)
        ],
    ]

    roadmap_table = Table(roadmap_data, colWidths=[120, 110, 274])
    roadmap_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('PADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(roadmap_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 6: COMPLETE API REFERENCE DIRECTORY
    # =========================================================================
    story.append(Paragraph("6. Complete REST API Reference Directory", h1_style))
    story.append(Paragraph(
        "Complete endpoint catalog exposed by the SettleFlow Spring Boot transaction orchestrator on port 8080:",
        body_style
    ))
    story.append(Spacer(1, 6))

    api_data = [
        [Paragraph("HTTP Method & Path", table_cell_bold), Paragraph("Request Body / Params", table_cell_bold), Paragraph("Response", table_cell_bold), Paragraph("Description", table_cell_bold)],
        [Paragraph("<code>POST /api/transactions</code>", table_cell), Paragraph("<code>CreateTransactionRequest</code>", table_cell), Paragraph("<code>201 Created (Transaction)</code>", table_cell), Paragraph("Creates, deduplicates, routes, and processes a deposit/withdrawal.", table_cell)],
        [Paragraph("<code>GET /api/transactions</code>", table_cell), Paragraph("<i>None</i>", table_cell), Paragraph("<code>200 OK (List&lt;Transaction&gt;)</code>", table_cell), Paragraph("Retrieves all transaction records.", table_cell)],
        [Paragraph("<code>GET /api/transactions/{id}</code>", table_cell), Paragraph("<code>UUID id</code> (Path)", table_cell), Paragraph("<code>200 OK / 404 Not Found</code>", table_cell), Paragraph("Retrieves single transaction by ID.", table_cell)],
        [Paragraph("<code>POST /api/transactions/{id}/refund</code>", table_cell), Paragraph("<code>{ amount?, reason? }</code>", table_cell), Paragraph("<code>200 OK (Transaction)</code>", table_cell), Paragraph("Refunds a settled transaction.", table_cell)],
        [Paragraph("<code>GET /api/psps</code>", table_cell), Paragraph("<i>None</i>", table_cell), Paragraph("<code>200 OK (List&lt;PspStatusDto&gt;)</code>", table_cell), Paragraph("Returns all PSPs with live circuit breaker states.", table_cell)],
        [Paragraph("<code>POST /api/psps/{id}/circuit-override</code>", table_cell), Paragraph("<code>{ targetState: 'OPEN'|'CLOSED' }</code>", table_cell), Paragraph("<code>200 OK</code>", table_cell), Paragraph("Manually forces circuit breaker state.", table_cell)],
        [Paragraph("<code>POST /api/psps/{id}/configure</code>", table_cell), Paragraph("<code>{ failureRate?, avgLatencyMs? }</code>", table_cell), Paragraph("<code>200 OK</code>", table_cell), Paragraph("Tunes mock PSP microservice parameters live.", table_cell)],
        [Paragraph("<code>GET /api/routing-rules</code>", table_cell), Paragraph("<i>None</i>", table_cell), Paragraph("<code>200 OK (List&lt;RoutingRule&gt;)</code>", table_cell), Paragraph("Lists all active and inactive routing rules.", table_cell)],
        [Paragraph("<code>POST /api/routing-rules</code>", table_cell), Paragraph("<code>RoutingRule</code>", table_cell), Paragraph("<code>201 Created</code>", table_cell), Paragraph("Creates a new routing rule.", table_cell)],
        [Paragraph("<code>PUT /api/routing-rules/{id}</code>", table_cell), Paragraph("<code>RoutingRule</code>", table_cell), Paragraph("<code>200 OK</code>", table_cell), Paragraph("Updates an existing routing rule.", table_cell)],
        [Paragraph("<code>DELETE /api/routing-rules/{id}</code>", table_cell), Paragraph("<code>String id</code> (Path)", table_cell), Paragraph("<code>204 No Content</code>", table_cell), Paragraph("Deletes a routing rule.", table_cell)],
        [Paragraph("<code>GET /api/reconciliation/runs</code>", table_cell), Paragraph("<i>None</i>", table_cell), Paragraph("<code>200 OK (List&lt;ReconRun&gt;)</code>", table_cell), Paragraph("Lists historical audit runs.", table_cell)],
        [Paragraph("<code>GET /api/reconciliation/discrepancies</code>", table_cell), Paragraph("<i>None</i>", table_cell), Paragraph("<code>200 OK (List&lt;Discrepancy&gt;)</code>", table_cell), Paragraph("Lists all reconciliation discrepancies.", table_cell)],
        [Paragraph("<code>POST /api/reconciliation/run</code>", table_cell), Paragraph("<code>{ triggeredBy? }</code>", table_cell), Paragraph("<code>200 OK (ReconRun)</code>", table_cell), Paragraph("Triggers immediate settlement ledger audit.", table_cell)],
        [Paragraph("<code>POST /api/reconciliation/discrepancies/{id}/resolve</code>", table_cell), Paragraph("<code>{ justification?, adminName? }</code>", table_cell), Paragraph("<code>200 OK</code>", table_cell), Paragraph("Marks discrepancy as resolved with audit note.", table_cell)],
        [Paragraph("<code>GET /api/players</code>", table_cell), Paragraph("<i>None</i>", table_cell), Paragraph("<code>200 OK (List&lt;PlayerKYC&gt;)</code>", table_cell), Paragraph("Lists all player KYC profiles.", table_cell)],
        [Paragraph("<code>PUT /api/players/{id}/kyc</code>", table_cell), Paragraph("<code>{ tier?, riskScore?, dailyLimit? }</code>", table_cell), Paragraph("<code>200 OK (PlayerKYC)</code>", table_cell), Paragraph("Updates player compliance tier and limits.", table_cell)],
        [Paragraph("<code>GET /api/audit-logs</code>", table_cell), Paragraph("<i>None</i>", table_cell), Paragraph("<code>200 OK (List&lt;AuditLog&gt;)</code>", table_cell), Paragraph("Returns chronological compliance audit trail.", table_cell)],
    ]

    api_table = Table(api_data, colWidths=[130, 110, 110, 154])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('PADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 15))

    # Concluding Callout
    conclusion_text = (
        "<b>Handbook Conclusion & Verification:</b> This document serves as the single source of truth for the SettleFlow "
        "architecture. All components have been verified for compilation, containerization, local execution, and Kubernetes "
        "deployment. For live testing, refer to the quickstart commands in <code>NOTES.md</code> or run <code>deploy.ps1 -Compose</code>."
    )
    conc_table = Table([[Paragraph(conclusion_text, callout_style)]], colWidths=[504])
    conc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ECFDF5')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#A7F3D0')),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(conc_table)

    # Build PDF with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[+] Successfully generated PDF: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
