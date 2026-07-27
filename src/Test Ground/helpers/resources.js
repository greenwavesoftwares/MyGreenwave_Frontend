/* ═══════════════════════════════════════════════════════
   Resource lookup helpers
   ═══════════════════════════════════════════════════════ */

export function getResources(groups, groupResources) {
  if (!groupResources || typeof groupResources !== "object") return [];
  const seen = new Set();
  const out = [];
  groups.forEach((g) => {
    const groupArr = groupResources[g];
    if (!Array.isArray(groupArr)) return;
    groupArr.forEach((r) => {
      if (!r || typeof r.userId !== "string" || r.userId.length === 0) return;
      if (seen.has(r.userId)) return;
      seen.add(r.userId);
      out.push(r);
    });
  });
  return out;
}

export function getResourceByUserId(userId, groups, groupResources) {
  if (!userId || !groupResources) return null;
  return (
    getResources(groups, groupResources).find((r) => r.userId === userId) ||
    null
  );
}

export function getGroupName(groupId, groupLabels) {
  return groupLabels.find((g) => g.groupId === groupId)?.groupName || groupId;
}

export function getActiveGroups(groupLabels) {
  return groupLabels.filter((g) => g.active);
}