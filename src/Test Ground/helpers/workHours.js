/* ═══════════════════════════════════════════════════════
   Work-hours & leave-aware scheduling helpers
   ═══════════════════════════════════════════════════════ */

import { WORK_START_HR, WORK_END_HR } from "./constants";
import { isoDate, isWeekday } from "./dateUtils";

export function leavesFor(userId, groupResources) {
  if (!userId || !groupResources || typeof groupResources !== "object")
    return [];
  for (const g of Object.keys(groupResources)) {
    const r = groupResources[g]?.find((x) => x.userId === userId);
    if (r) return r.leaves || [];
  }
  return [];
}

export function leaveOnDay(userId, d, groupResources) {
  if (!userId || !d) return null;
  const key = isoDate(d);
  return leavesFor(userId, groupResources).find((l) => l.date === key) || null;
}

export function nextWorkMoment(dt, userId, groupResources = {}) {
  let d = new Date(dt);
  for (let i = 0; i < 730; i++) {
    if (!isWeekday(d)) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    if (leaveOnDay(userId, d, groupResources)) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    const hr = d.getHours() + d.getMinutes() / 60;
    if (hr < WORK_START_HR) {
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    if (hr >= WORK_END_HR) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      continue;
    }
    return d;
  }
  return d;
}

export function addWorkHours(startDt, hours, userId, groupResources = {}) {
  let d = nextWorkMoment(new Date(startDt), userId, groupResources);
  let remaining = Number(hours) || 0;
  if (remaining <= 0) return d;
  for (let i = 0; i < 730 && remaining > 0; i++) {
    const hr = d.getHours() + d.getMinutes() / 60;
    const avail = WORK_END_HR - hr;
    if (avail <= 0) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      d = nextWorkMoment(d, userId, groupResources);
      continue;
    }
    if (remaining <= avail + 1e-9) {
      d = new Date(d.getTime() + Math.round(remaining * 60) * 60000);
      remaining = 0;
    } else {
      remaining -= avail;
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START_HR, 0, 0, 0);
      d = nextWorkMoment(d, userId, groupResources);
    }
  }
  return d;
}

export function defaultFirstStart(userId, groupResources = {}) {
  const now = new Date();
  const hr = now.getHours() + now.getMinutes() / 60;
  let baseDate;

  if (hr < WORK_START_HR) {
    baseDate = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(),
      WORK_START_HR, 0, 0, 0,
    );
  } else if (hr > WORK_END_HR) {
    baseDate = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + 1,
      WORK_START_HR, 0, 0, 0,
    );
  } else {
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    baseDate = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(),
      now.getHours(), roundedMinutes, 0, 0,
    );
    if (baseDate.getHours() >= WORK_END_HR) {
      baseDate = new Date(
        now.getFullYear(), now.getMonth(), now.getDate() + 1,
        WORK_START_HR, 0, 0, 0,
      );
    }
  }

  return nextWorkMoment(baseDate, userId, groupResources);
}