// RFC 4122 v4 id. crypto.randomUUID() only exists in secure contexts (HTTPS / localhost),
// so it is undefined when the app is opened over plain http on a LAN address
// (e.g. http://192.168.x.x:5173). crypto.getRandomValues works everywhere, so fall back to it.
export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(b);
  } else {
    for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  }
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function addComment(projectId,activityId,moduleId,activityName=''){
    return({
    projectId,
    activityId,
    commentDescription: "",
    commentType: "INFO",
    resolutionDate: "",
    responsibility: "",
    actionPoint: "",
    others: "",
    attachment: null,
    attachmentName: null, // ← NEW: store original file name
    moduleId,
    name:activityName
  })
  }
  export function managerFeedback() {
  return [
    {
      id: "communication",
      label: "Communication",
      description: "Communicates expectations, priorities, decisions, and updates clearly and effectively.",
    },
    {
      id: "support",
      label: "Support & Accessibility",
      description: "Is available when needed, provides guidance, and helps remove blockers.",
    },
    {
      id: "fairness",
      label: "Fairness & Impartiality",
      description: "Treats team members consistently and makes decisions without favoritism or bias.",
    },
    {
      id: "feedback",
      label: "Feedback & Recognition",
      description: "Provides constructive feedback and appropriately recognizes good performance and contributions.",
    },
    {
      id: "growth",
      label: "Growth & Development",
      description: "Supports learning, skill development, career growth, and meaningful opportunities.",
    },
    {
      id: "workload",
      label: "Workload Management",
      description: "Distributes work fairly, sets realistic expectations, and manages priorities effectively.",
    },
    {
      id: "decision_making",
      label: "Decision Making",
      description: "Makes timely, well-informed decisions and communicates the reasoning when appropriate.",
    },
    {
      id: "psychological_safety",
      label: "Psychological Safety",
      description: "Creates an environment where employees can raise concerns, ask questions, and disagree respectfully.",
    },
    {
      id: "trust_autonomy",
      label: "Trust & Autonomy",
      description: "Trusts employees to perform their responsibilities without unnecessary micromanagement.",
    },
    {
      id: "accountability",
      label: "Accountability",
      description: "Takes ownership of decisions and team outcomes and addresses problems constructively.",
    },
    {
      id: "collaboration",
      label: "Team Collaboration",
      description: "Encourages cooperation, respect, and healthy collaboration within the team.",
    },
    {
      id: "work_life_balance",
      label: "Work-Life Balance",
      description: "Respects reasonable working hours, personal boundaries, leave, and employee well-being.",
    },
  ];
}