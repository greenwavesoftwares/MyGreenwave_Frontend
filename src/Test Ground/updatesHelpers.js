/* ─── Predefined User Data (Hardcoded for Testing) ─── */
export const USER_DATA = [
  {
    userId: "john.doe@greenwave.co.in",
    userName: "John Doe (Project Owner)",
    employeeId: 1,
    department: "Management",
    designation: "Project Manager",
    active: true,
  },
  {
    userId: "abhirup.paul@greenwave.co.in",
    userName: "Abhirup Paul",
    employeeId: 175,
    department: "Automation",
    designation: "Project Engineer",
    active: true,
  },
  {
    userId: "abhishek.bhowmick@greenwave.co.in",
    userName: "Abhishek Bhowmick",
    employeeId: 106,
    department: "Software",
    designation: "Software Developer",
    active: true,
  },
  {
    userId: "abhishek.ghosh@greenwave.co.in",
    userName: "Abhishek Ghosh",
    employeeId: 2,
    department: "Automation",
    designation: "Manager",
    active: true,
  },
  {
    userId: "arundhati.ghosh@greenwave.co.in",
    userName: "Arundhati Ghosh",
    employeeId: 45,
    department: "HR",
    designation: "HR Executive",
    active: true,
  },
  {
    userId: "nivedita.singh@greenwave.co.in",
    userName: "Nivedita Singh",
    employeeId: 88,
    department: "IT",
    designation: "System Admin",
    active: true,
  },
  {
    userId: "anushka.kar@greenwave.co.in",
    userName: "Anushka Kar",
    employeeId: 92,
    department: "Marketing",
    designation: "Marketing Executive",
    active: true,
  },
  {
    userId: "avrajit.roy@greenwave.co.in",
    userName: "Avrajit Roy",
    employeeId: 15,
    department: "Software",
    designation: "Tech Lead",
    active: true,
  },
];

/* ─── Permission Role Calculator ─── */
export function getCategoryRole(category, currentUserId, projectOwnerId) {
  if (!currentUserId) return "viewer";
  if (currentUserId.toLowerCase() === projectOwnerId?.toLowerCase())
    return "owner";

  const isShared = category.sharedWith?.some(
    (u) => u.userId.toLowerCase() === currentUserId.toLowerCase(),
  );

  if (isShared) return "collaborator";
  return "viewer";
}

/* ─── Permission Check Utilities ─── */
export function canEditCategoryNotes(role) {
  return role === "owner" || role === "collaborator";
}

export function canManageCategory(role) {
  return role === "owner";
}

export function canAddSnapshot(
  isOwner,
  categories,
  currentUserId,
  projectOwnerId,
) {
  if (isOwner) return true;
  return categories.some(
    (cat) =>
      getCategoryRole(cat, currentUserId, projectOwnerId) === "collaborator",
  );
}

export function canDeleteSnapshot(currentUserId, projectOwnerId) {
  if (!currentUserId || !projectOwnerId) return false;
  return currentUserId.toLowerCase() === projectOwnerId.toLowerCase();
}

/* ─── User Lookup ─── */
export function findUserById(userId) {
  if (!userId) return null;
  return (
    USER_DATA.find(
      (u) => u.userId.toLowerCase() === userId.toLowerCase(),
    ) || null
  );
}

/* ─── Search Users ─── */
export function searchUsers(query, excludeIds = [], activeOnly = true) {
  const q = (query || "").toLowerCase().trim();
  const excludeSet = new Set(excludeIds.map((id) => id.toLowerCase()));

  return USER_DATA.filter((u) => {
    if (activeOnly && !u.active) return false;
    if (excludeSet.has(u.userId.toLowerCase())) return false;
    if (!q) return true;
    return (
      u.userName.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      (u.department || "").toLowerCase().includes(q) ||
      (u.designation || "").toLowerCase().includes(q)
    );
  });
}

/* ─── Format Time Ago ─── */
export function timeAgo(iso) {
  if (!iso) return "";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ─── Hardcoded Test Data ─── */
export const HARDCODED_TEST_UPDATES = {
  categories: [
    {
      id: "cat_test_1",
      name: "Detail Engineering",
      order: 0,
      createdAt: "2026-05-01T10:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
      sharedWith: [], // Owner only
    },
    {
      id: "cat_test_2",
      name: "Manufacturing",
      order: 1,
      createdAt: "2026-05-01T10:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
      sharedWith: [], // Owner only
    },
    {
      id: "cat_test_3",
      name: "Billing",
      order: 2,
      createdAt: "2026-05-01T10:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
      sharedWith: [
        {
          userId: "abhirup.paul@greenwave.co.in",
          userName: "Abhirup Paul",
          sharedAt: "2026-06-20T14:00:00Z",
          sharedBy: "john.doe@greenwave.co.in",
        },
        {
          userId: "abhishek.bhowmick@greenwave.co.in",
          userName: "Abhishek Bhowmick",
          sharedAt: "2026-06-20T14:00:00Z",
          sharedBy: "john.doe@greenwave.co.in",
        },
      ], // Shared with 2 users
    },
    {
      id: "cat_test_4",
      name: "Site Progress",
      order: 3,
      createdAt: "2026-05-01T10:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
      sharedWith: [
        {
          userId: "abhirup.paul@greenwave.co.in",
          userName: "Abhirup Paul",
          sharedAt: "2026-06-22T09:00:00Z",
          sharedBy: "john.doe@greenwave.co.in",
        },
        {
          userId: "abhishek.bhowmick@greenwave.co.in",
          userName: "Abhishek Bhowmick",
          sharedAt: "2026-06-22T09:00:00Z",
          sharedBy: "john.doe@greenwave.co.in",
        },
      ], // Shared with 2 users
    },
    {
      id: "cat_test_5",
      name: "Payment",
      order: 4,
      createdAt: "2026-05-01T10:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
      sharedWith: [], // Owner only
    },
    {
      id: "cat_test_6",
      name: "Ongoing Discussion",
      order: 5,
      createdAt: "2026-05-01T10:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
      sharedWith: [
        {
          userId: "abhishek.bhowmick@greenwave.co.in",
          userName: "Abhishek Bhowmick",
          sharedAt: "2026-06-23T11:00:00Z",
          sharedBy: "john.doe@greenwave.co.in",
        },
      ], // Only shared with Abhishek
    },
  ],
  snapshots: [
    {
      id: "snap_test_1",
      date: "2026-05-27", // Past
      label: "Weekly Review",
      createdAt: "2026-05-27T09:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
    },
    {
      id: "snap_test_2",
      date: "2026-06-15", // Past
      label: "",
      createdAt: "2026-06-15T09:00:00Z",
      createdBy: "john.doe@greenwave.co.in",
    },
    {
      id: "snap_test_3",
      date: getFutureDate(7), // Future (editable)
      label: "Upcoming Review",
      createdAt: new Date().toISOString(),
      createdBy: "john.doe@greenwave.co.in",
    },
  ],
  entries: {
    // Row 1 (Detail Engineering) - Owner only
    cat_test_1_snap_test_1: {
      note: {
        id: "note_1",
        text: "DONE",
        author: "john.doe@greenwave.co.in",
        createdAt: "2026-05-27T10:00:00Z",
      },
    },
    // Row 2 (Manufacturing) - Owner only
    cat_test_2_snap_test_1: {
      note: {
        id: "note_2",
        text: "DONE",
        author: "john.doe@greenwave.co.in",
        createdAt: "2026-05-27T10:00:00Z",
      },
    },
    // Row 3 (Billing) - Shared
    cat_test_3_snap_test_1: {
      note: {
        id: "note_3",
        text: "Except dispatch module all other modules have been delivered for New requirement shared. One report from OLD requirement is pending as ITC's clarification is awaited.",
        author: "abhirup.paul@greenwave.co.in",
        createdAt: "2026-05-27T11:00:00Z",
      },
    },
    // Row 4 (Site Progress) - Shared
    cat_test_4_snap_test_1: {
      note: {
        id: "note_4",
        text: "Final sign off is expected to be done by 7th June",
        author: "abhirup.paul@greenwave.co.in",
        createdAt: "2026-05-27T12:00:00Z",
      },
    },
    cat_test_4_snap_test_2: {
      note: {
        id: "note_5",
        text: "Argha to deploy application online. If not done then he has to visit once to complete the same. Union issue may hindrance in sign off.",
        author: "abhishek.bhowmick@greenwave.co.in",
        createdAt: "2026-06-15T14:00:00Z",
      },
    },
    // Row 5 (Payment) - Owner only
    cat_test_5_snap_test_1: {
      note: {
        id: "note_6",
        text: "2.96L has not been released because of final signoff. SQL payment of 90K is due.",
        author: "john.doe@greenwave.co.in",
        createdAt: "2026-05-27T15:00:00Z",
      },
    },
    // Row 6 (Ongoing Discussion) - Shared with Abhishek only
    cat_test_6_snap_test_2: {
      note: {
        id: "note_7",
        text: "Avik to visit July 1st week of July for new line integration offer discussion.",
        author: "abhishek.bhowmick@greenwave.co.in",
        createdAt: "2026-06-15T16:00:00Z",
      },
    },
  },
};

/* Helper to generate future date */
function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}