export type SceneMeta = {
  id: string;
  title: string;
  kicker: string;
  nav: string;
  beats: number;
  /** Presenter narration for the scene. */
  notes?: string;
  /** Tender pages the scene draws on. */
  source?: string;
  /** Detailed slide kept after Thank You for questions; skipped in the main flow. */
  backup?: boolean;
};

export const SCENES: SceneMeta[] = [
  {
    id: "title",
    title: "Advertisement Monitoring Tool",
    kicker: "DIPR · Government of Karnataka · Inventech Info Solutions",
    nav: "Open",
    beats: 3,
  },
  {
    id: "understanding",
    title: "Our Understanding",
    kicker: "Plan · Assets · Proof-of-Display · Reporting · Security",
    nav: "Understanding",
    beats: 8,
    notes:
      "Our understanding is that DIPR is looking for more than an advertisement recording application. The requirement is to establish an integrated platform that connects campaign planning, creative asset management, advertising execution and field-level verification. The solution must support multiple advertising channels, provide a mobile application for field personnel, capture verifiable Proof-of-Display evidence and consolidate operational information into dashboards and reports. All these capabilities must operate within a secure, integrated and maintainable application environment.",
    source: "DIPR RFP: Project Overview and Objectives (page 5), Technical Requirements and Deliverables (page 6)",
  },
  {
    id: "challenge",
    title: "Managing Advertising Activities Across Multiple Channels",
    kicker: "The current business challenge",
    nav: "Challenge",
    beats: 4,
    notes:
      "Consider a single advertising campaign. It may involve multiple newspapers, digital platforms and outdoor locations. Each activity generates its own information and supporting evidence. The department needs to bring these records together so that campaign status, execution details, verification evidence and expenditure can be reviewed in a consistent manner.",
  },
  {
    id: "solution",
    title: "One Integrated Platform for the Complete Advertising Lifecycle",
    kicker: "Introducing the proposed solution",
    nav: "Solution",
    beats: 5,
    notes:
      "The solution is designed around two complementary interfaces. The web application provides DIPR officials with centralized administration, campaign management, approvals and reporting. The mobile application supports field personnel in capturing advertisement evidence, recording location information and synchronizing field activities with the central platform. Both interfaces operate as part of one integrated application ecosystem.",
  },
  {
    id: "campaign",
    title: "Every Campaign Begins with a Structured Digital Request",
    kicker: "A new campaign enters the system",
    nav: "Campaign",
    beats: 7,
    notes:
      "We begin with a new campaign request. DIPR initiates a public awareness campaign to communicate an important Government of Karnataka initiative, to be published through newspapers, digital platforms and outdoor advertising locations. The campaign officer enters the basic information, selects the required advertising channels and records the proposed schedule and budget. Once registered, the campaign becomes the common reference point for all subsequent activities. This avoids maintaining separate campaign information for different media channels.",
  },
  {
    id: "approval",
    title: "From Campaign Request to Approved Media Plan",
    kicker: "Campaign planning, budgeting and approval",
    nav: "Approval",
    beats: 6,
    notes:
      "Once the campaign is registered, it needs to be reviewed and approved before execution. DIPR officials review the campaign details, proposed media channels, schedules and budget. At this stage, the campaign moves from registration to planning and approval. The department can review the proposed advertising activities, budget and schedule before allowing execution to proceed. The system maintains the campaign's status and associated information, providing a common view for authorized officers.",
  },
  {
    id: "assets",
    title: "Every Advertisement Creative. One Centralized Repository.",
    kicker: "Centralized advertising asset inventory",
    nav: "Assets",
    beats: 7,
    notes:
      "The campaign has been approved. The creative team now prepares advertisements for newspapers, digital platforms and outdoor display locations, and the platform provides a centralized repository to manage all associated creative assets. Instead of managing creatives separately for every publication or display location, the platform maintains a common asset repository. Authorized users can upload, classify, retrieve and manage creative versions. This ensures that the relevant advertisement creative can be associated with its corresponding campaign and execution records.",
  },
  {
    id: "execution",
    title: "One Campaign. Multiple Advertising Channels.",
    kicker: "Multi-channel advertising execution",
    nav: "Execution",
    beats: 6,
    notes:
      "The campaign is now ready for execution. DIPR coordinates the advertising activities across different media channels, each with its own publication and display requirements, and the platform maintains campaign-wise execution information. The same campaign may be executed through several different media. For example, the campaign may appear in newspapers, on digital platforms and at outdoor locations. Rather than maintaining separate campaign records, the application connects the different advertising activities to the same campaign. This provides DIPR with a consolidated view of campaign execution.",
  },
  {
    id: "vendors",
    title: "Connecting Campaign Activities with Empanelled Agencies",
    kicker: "Agency coordination and campaign tracking",
    nav: "Agencies",
    beats: 7,
    notes:
      "Once the media plan is finalized, advertising execution activities need to be coordinated with the respective empanelled agencies. The platform maintains agency-related information and associates execution activities with the relevant campaigns. Once activities are assigned, DIPR needs to know which activities have been completed and which are still pending. The application maintains campaign-wise execution information and provides visibility into the progress of associated activities. This also creates a structured reference for subsequent evidence verification and reporting.",
  },
  {
    id: "field",
    title: "Taking Advertisement Monitoring from the Office to the Field",
    kicker: "Mobile application for field verification",
    nav: "Field App",
    beats: 7,
    notes:
      "The mobile application takes advertisement monitoring from the office to the field. Field personnel sign in securely and see the activities assigned to them. At the advertisement location they capture photo or video evidence, and the application records the GPS location, date and time along with their remarks. Where there is no network, the evidence is saved on the device and synchronized automatically with the central platform once connectivity is available.",
  },
  {
    id: "verify",
    title: "From Advertisement Display Claims to Verifiable Evidence",
    kicker: "Proof-of-Display verification",
    nav: "Verification",
    beats: 8,
    notes:
      "Evidence submitted from the field arrives in the Proof of Display module against its campaign and activity. A DIPR officer reviews the photo and video, the GPS coordinates and timestamp, and the device information recorded at capture. The evidence is checked against the approved creative and agency details, and the officer approves it, rejects it or requests a revisit. Each decision is recorded in the verification workflow, turning a display claim into verifiable evidence.",
  },
  {
    id: "monitor",
    title: "Identifying Execution Gaps Through Centralized Monitoring",
    kicker: "Compliance and exception monitoring",
    nav: "Monitoring",
    beats: 6,
    notes:
      "With execution and verification information in one place, DIPR can see where campaigns are falling behind. The dashboard shows planned versus actual activities by media channel, the status of evidence verification, and an exception queue of activities that are pending, delayed, missing evidence or awaiting verification. Officers can review each exception, examine the supporting evidence and track unresolved cases, while the system maintains audit records of actions and decisions.",
  },
  {
    id: "dashboard",
    title: "Every Campaign. Every Channel. One Consolidated Dashboard.",
    kicker: "Management dashboard",
    nav: "Dashboard",
    beats: 8,
    notes:
      "All of this information comes together in one management dashboard. DIPR officials and management can see the status of every campaign, the allocated budget against actual expenditure by media channel, the progress of execution activities, and the outcome of Proof-of-Display verification. Media-wise execution and campaign-level KPIs make it possible to review progress, expenditure and verification status from a single view.",
  },
  {
    id: "reports",
    title: "Turning Campaign Information into Actionable Reports",
    kicker: "Reports and analytics",
    nav: "Reports",
    beats: 7,
    notes:
      "The information captured across the advertising lifecycle is available as structured reports. Officials can filter campaign records by campaign, media channel, status and date range, and view campaign, financial, compliance and agency reports. Reports can be exported in PDF and CSV formats or scheduled periodically, and access to reports and analytics is controlled by user role. This supports campaign reviews, administrative monitoring and management decisions.",
  },
  {
    id: "security",
    title: "Every User. Every Action. Controlled and Accountable.",
    kicker: "Security, access control and audit",
    nav: "Security",
    beats: 5,
    notes:
      "The application is organised around six defined user roles, from the Super Administrator to Field and Reporting Officers. Role-based access control, single sign-on and multi-factor authentication where requested control who can do what. Data is encrypted in transit and at rest, API access is secured, and every create, approve, verify and report action is recorded in the audit trail for review and inspection.",
  },
  {
    id: "platform",
    title: "A Secure, Scalable and Integrated Application Architecture",
    kicker: "Users, applications, core modules, secure integration and hosting",
    nav: "Architecture",
    beats: 6,
    notes:
      "DIPR officials, empanelled agencies and field teams use the web and mobile applications. Both run on the same core modules: campaign management, asset repository, execution tracking, proof-of-display, reports and user access. Secure APIs connect the platform with Khajane-II, document management, the user directory and SSO, verification services, maps and the NIC SMS gateway. The platform is hosted at the Karnataka State Data Centre or a MeitY-empanelled cloud, with backup, recovery and monitoring.",
  },
  {
    id: "delivery",
    title: "A Structured 18-Week Implementation Roadmap",
    kicker: "Phased delivery with quality gates",
    nav: "Roadmap",
    beats: 3,
    notes:
      "Implementation is planned over 18 weeks in five phases: requirements and prototype, development and integration, testing and UAT, deployment and handover, and support and stabilization. Quality is built in through functional, integration and security testing, including VAPT by a CERT-In empanelled auditor, followed by user acceptance testing and sign-off before production release.",
  },
  {
    id: "golive",
    title: "Beyond Go-Live – Operational Support and Continuity",
    kicker: "Deployment, training, documentation and service-level commitments",
    nav: "Support",
    beats: 4,
    notes:
      "After development the platform is deployed at the Karnataka State Data Centre or a MeitY-empanelled cloud, validated for production readiness and handed over. DIPR administrators and end users are trained, and the architecture document, user manual, API guide and maintenance guide are delivered. Support follows the RFP service levels: 99.5 percent monthly uptime and defined response times for each severity level.",
  },
  {
    id: "summary",
    title: "From Campaign Management to Complete Advertising Intelligence",
    kicker: "A unified digital ecosystem for transparent, verifiable and accountable advertising operations",
    nav: "Summary",
    beats: 8,
    notes:
      "The proposed Advertisement Monitoring Tool brings the complete advertising lifecycle into one integrated platform. Campaigns, budgets, schedules, approvals and agencies are managed centrally. Creatives, metadata, versions and geo-tagged assets are maintained in a unified inventory. Photographs, videos, GPS coordinates and timestamps support proof-of-display verification. Campaign progress, expenditure, compliance and user activities are monitored transparently, and consolidated dashboards, reports and KPIs support informed decisions. One campaign, multiple channels, verified execution and complete visibility.",
  },
  { id: "thanks", title: "Thank You", kicker: "Advertisement Monitoring Tool", nav: "Thanks", beats: 1 },
  {
    id: "access",
    title: "Every User. Every Action. Controlled and Accountable.",
    kicker: "Security, access control and audit",
    nav: "Security",
    beats: 7,
    backup: true,
    notes:
      "The application is organised around clearly defined user roles, from the Super Administrator to Field and Reporting Officers. Each role has specific responsibilities, and a role-based permission matrix controls which functions every user can access. User and access management, secure authentication, encryption and controlled API access protect the platform, while audit trails record user activities such as creating, approving, verifying and reporting. This provides a controlled environment with security, accountability and traceability.",
  },
  {
    id: "integration",
    title: "A Connected Platform Within the DIPR Digital Ecosystem",
    kicker: "Secure integration with existing systems and external verification services",
    nav: "Integration",
    beats: 7,
    backup: true,
    notes:
      "The DIPR Advertisement Monitoring Tool sits at the centre of the DIPR digital ecosystem. Through secure API integration it can connect with departmental systems such as campaign management, financial, document management and user directory or SSO, where available. The mobile application supports field monitoring and evidence capture, and the platform can integrate with third-party verification services and other external services such as maps and notifications as required. Integration is governed by secure API communication, controlled access, monitoring and audit records, giving a scalable and interoperable platform.",
  },
  {
    id: "architecture",
    title: "A Secure, Scalable and Integrated Application Architecture",
    kicker: "Designed for web administration, mobile field operations and centralized information management",
    nav: "Architecture",
    beats: 7,
    backup: true,
    notes:
      "The application is organised in six layers. The presentation layer provides web and mobile access for different user groups. The application layer delivers the business services, from campaign management and asset inventory to proof-of-display, reporting, user management, agency execution and workflow. The integration layer provides secure APIs for DIPR systems and third-party services. The data management layer holds campaign data, the asset repository, evidence, GPS metadata and audit records. The security layer covers role-based access, authentication, encryption, API security, audit logging and data retention, and the infrastructure layer handles hosting, storage, backup, monitoring and maintenance. Together they provide a robust, secure and scalable platform.",
  },
  {
    id: "quality",
    title: "Quality Assurance at Every Stage of Development",
    kicker: "Validating functionality, integrations, security and operational readiness",
    nav: "Quality",
    beats: 8,
    backup: true,
    notes:
      "Every stage from development to production release is validated. Functional testing covers campaign creation, approvals, asset handling, agency assignment, proof-of-display and reporting. Integration testing checks the web and mobile applications, APIs, external services and data synchronization. Mobile testing covers Android and iOS compatibility, media and GPS capture, offline collection and synchronization. Security testing validates authentication, role-based access, API security, encryption and vulnerabilities, and user acceptance testing with DIPR users leads to sign-off. Test strategy, plans, cases, defect records, UAT documentation and a release readiness report are delivered, giving a thoroughly tested application ready for production.",
  },
  {
    id: "roadmap",
    title: "A Structured 18-Week Implementation Roadmap",
    kicker: "Phased development, testing, deployment and stabilization",
    nav: "Roadmap",
    beats: 7,
    backup: true,
    notes:
      "Implementation is planned over 18 weeks in five phases. Weeks 1 to 3 cover requirements finalization with DIPR, UI/UX and prototype development. Weeks 4 to 7 cover development of the core modules and integration with DIPR systems and external services. Weeks 8 to 11 cover system and integration testing, defect rectification, performance checks and user acceptance testing. Weeks 12 to 16 cover production deployment, data configuration, user setup, training and handover, and weeks 17 and 18 cover post-deployment support, stabilization and go-live confirmation. The result is a fully deployed and tested Advertisement Monitoring Tool within the prescribed 18-week period.",
  },
  {
    id: "support",
    title: "Beyond Go-Live – Operational Support and Continuity",
    kicker: "Deployment, knowledge transfer, maintenance and service-level commitments",
    nav: "Support",
    beats: 6,
    backup: true,
    notes:
      "Delivery continues beyond go-live. Deployment and handover cover production deployment, hosting at the Karnataka State Data Centre or a MeitY-empanelled cloud, application and storage setup, readiness validation and system handover. Documentation includes the architecture document, technical documentation, user manuals, administrator guides, API documentation and deployment and maintenance documentation. Training covers DIPR administrators and end users, with role-based demonstrations, knowledge transfer and operational handover. Maintenance and support follow the service-level commitments in the RFP, including 99.5 percent uptime and defined response times by priority, with resolution timelines as agreed in the Agreement.",
  },
  {
    id: "ecosystem",
    title: "Overall Application Ecosystem",
    kicker: "An Integrated Digital Ecosystem Connecting Campaign Management, Advertising Execution, Field Monitoring and Management Intelligence",
    nav: "Ecosystem",
    beats: 8,
    backup: true,
    notes:
      "The Advertisement Monitoring Tool acts as a centralized platform connecting DIPR officials, empanelled advertising agencies, field personnel and external systems through web and mobile applications. DIPR officials handle administration, approvals, monitoring and reports; agencies handle campaign execution, asset deployment and updates; field teams handle verification, photo and video capture, GPS and evidence submission. The web and mobile applications sit on integrated application services and an integration and data management layer of secure APIs, a data repository and media storage. The platform covers print, digital and outdoor channels and integrates with external, DIPR and third-party verification services, delivering centralized management, multi-channel execution, evidence-based verification, real-time visibility and data-driven decisions.",
  },
];

export const THANKS_INDEX = SCENES.findIndex((s) => s.id === "thanks");
export const BACKUP_START = THANKS_INDEX + 1;

export function slideLabel(i: number) {
  if (i === 0) return "•";
  if (i >= BACKUP_START) return `B${i - BACKUP_START + 1}`;
  return String(i).padStart(2, "0");
}

export const DEPT = {
  gov: "Government of Karnataka",
  name: "Department of Information and Public Relations",
  short: "DIPR",
  address: "Vartha Soudha, No. 17, Bhagwan Mahaveer Road (Infantry Road), Bengaluru 560 001",
  tender: "DIPR/DD(P)/E-Tender/AMT/2026-27",
  tenderDate: "28-08-2026",
};

export const COMPANY = {
  name: "Inventech Info Solutions Pvt. Ltd.",
  address: "Jayanagar, Bengaluru 560 011, Karnataka",
};
