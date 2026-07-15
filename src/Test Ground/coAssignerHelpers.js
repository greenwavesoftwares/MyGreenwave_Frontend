/* ═══════════════════════════════════════════════════════
   coAssignerHelpers.js
   Pure synchronous helpers.
   Updates-sharing must be resolved BEFORE calling these.
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   Compute detailed access flags for a user in a project.
   
   @param project        - the project object
   @param currentUserId  - the logged-in user's ID
   @param isUpdatesShared - boolean, resolved externally via API
   ═══════════════════════════════════════════════════════ */
export function computeProjectAccess(
  project,
  currentUserId,
  isUpdatesShared = false, // ← resolved externally, passed in
) {
  if (!project || !currentUserId) {
    return {
      role: "viewer",
      isOwner: false,
      isCoAssigner: false,
      isUpdatesShared: false,
      canAccessActivities: false,
      canAccessGantt: false,
      canAccessUpdates: false,
      canManageCoAssigners: false,
      canManageProject: false,
    };
  }

  const uid = currentUserId.toLowerCase();

  // Check ownership
  const isOwner = project.createdBy?.toLowerCase() === uid;

  // Check co-assigner status
  const isCoAssigner = (project.coAssigners || []).some(
    (ca) => ca.userId?.toLowerCase() === uid,
  );

  // Owner has everything
  if (isOwner) {
    return {
      role: "owner",
      isOwner: true,
      isCoAssigner: false,
      isUpdatesShared: false,
      canAccessActivities: true,
      canAccessGantt: true,
      canAccessUpdates: true,
      canManageCoAssigners: true,
      canManageProject: true,
    };
  }

  // Determine role string
  let role;
  if (isCoAssigner && isUpdatesShared) {
    role = "co-assigner-and-shared";
  } else if (isCoAssigner) {
    role = "co-assigner";
  } else if (isUpdatesShared) {
    role = "updates-shared";
  } else {
    role = "viewer";
  }

  return {
    role,
    isOwner: false,
    isCoAssigner,
    isUpdatesShared,
    canAccessActivities: isCoAssigner,
    canAccessGantt: isCoAssigner,
    canAccessUpdates: isCoAssigner || isUpdatesShared,
    canManageCoAssigners: false,
    canManageProject: isCoAssigner,
  };
}

/* ═══════════════════════════════════════════════════════
   Backward-compatible helpers
   ═══════════════════════════════════════════════════════ */
export function computeProjectRole(project, currentUserId, isUpdatesShared = false) {
  return computeProjectAccess(project, currentUserId, isUpdatesShared).role;
}

export function canEditProject(role) {
  return (
    role === "owner" ||
    role === "co-assigner" ||
    role === "co-assigner-and-shared"
  );
}

export function canManageCoAssigners(role) {
  return role === "owner";
}

export function canDeleteProject(role) {
  return role === "owner";
}

export function canAccessActivitiesTab(role) {
  return (
    role === "owner" ||
    role === "co-assigner" ||
    role === "co-assigner-and-shared"
  );
}

export function canAccessGanttTab(role) {
  return (
    role === "owner" ||
    role === "co-assigner" ||
    role === "co-assigner-and-shared"
  );
}

export function canAccessUpdatesTab(role) {
  return (
    role === "owner" ||
    role === "updates-shared" ||
    role === "co-assigner" ||
    role === "co-assigner-and-shared"
  );
}

/* ─── Check if project is co-assigned to user ─── */
export function isCoAssignedToUser(project, currentUserId) {
  if (!project || !currentUserId) return false;
  return (project.coAssigners || []).some(
    (ca) => ca.userId?.toLowerCase() === currentUserId?.toLowerCase(),
  );
}

/* ─── Format time ago ─── */
export function timeAgoShort(iso) {
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