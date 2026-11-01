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
    source: "DIPR tender: Project Overview and Objectives (page 5), Technical Requirements and Deliverables (page 6)",
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
    title: "Connecting Campaign Activities with Execution Partners",
    kicker: "Vendor coordination and campaign tracking",
    nav: "Vendors",
    beats: 7,
    notes:
      "Once the media plan is finalized, advertising execution activities need to be coordinated with the respective vendors. The platform maintains vendor-related information and associates execution activities with the relevant campaigns. Once activities are assigned, DIPR needs to know which activities have been completed and which are still pending. The application maintains campaign-wise execution information and provides visibility into the progress of associated activities. This also creates a structured reference for subsequent evidence verification and reporting.",
  },
  { id: "thanks", title: "Thank You", kicker: "Advertisement Monitoring Tool", nav: "Thanks", beats: 1 },
];

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
