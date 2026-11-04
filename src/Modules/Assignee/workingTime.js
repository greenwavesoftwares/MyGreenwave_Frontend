import dayjs from "dayjs";

/* ──────────────────────────────────────────────────────────
   workingTime.js
   Working-calendar maths shared by ProjectActivityInfo (actual
   duration) and ResumeDialog (rescheduling after a pause).

   A moment only "counts" if it falls
     • on a working weekday (not Sat/Sun by default),
     • on a day that is not a leave / holiday,
     • between workStart and workEnd (default 10:00 – 18:00).
   ────────────────────────────────────────────────────────── */

export const DEFAULT_WORK_CFG = {
  workStart: 10, // hour of day
  workEnd: 18,
  weekEnd: [0, 6], // dayjs().day(): 0 = Sun, 6 = Sat
};

const MS_PER_HOUR = 3600000;

/* leaves can be ISO strings, Dates, dayjs objects or {date}/{leaveDate}
   objects — normalise to a Set of "YYYY-MM-DD" for O(1) lookup. */
export const toLeaveSet = (leaves = []) =>
  new Set(
    (leaves || [])
      .map((l) => (l && typeof l === "object" && !dayjs.isDayjs(l) && !(l instanceof Date)
        ? l.date ?? l.leaveDate ?? l.day
        : l))
      .filter((l) => l && dayjs(l).isValid())
      .map((l) => dayjs(l).format("YYYY-MM-DD")),
  );

const isWorkingDay = (d, leaveSet, cfg) =>
  !cfg.weekEnd.includes(d.day()) && !leaveSet.has(d.format("YYYY-MM-DD"));

/* Working hours (decimal) between `start` and `end`. */
export function calculateWorkingHours(start, end, leaves = [], cfg = DEFAULT_WORK_CFG) {
  const s = dayjs(start);
  const e = dayjs(end);
  if (!s.isValid() || !e.isValid() || !e.isAfter(s)) return 0;

  const leaveSet = toLeaveSet(leaves);
  let total = 0;

  for (let day = s.startOf("day"); !day.isAfter(e, "day"); day = day.add(1, "day")) {
    if (!isWorkingDay(day, leaveSet, cfg)) continue;

    const winStart = day.hour(cfg.workStart).minute(0).second(0).millisecond(0);
    const winEnd = day.hour(cfg.workEnd).minute(0).second(0).millisecond(0);

    const from = s.isAfter(winStart) ? s : winStart;
    const to = e.isBefore(winEnd) ? e : winEnd;

    if (to.isAfter(from)) total += to.diff(from) / MS_PER_HOUR;
  }
  return total;
}

/* First working moment at or after `d` (skips weekends, leave, and the
   hours before workStart / after workEnd). */
export function snapToWorkingTime(d, leaves = [], cfg = DEFAULT_WORK_CFG) {
  const leaveSet = toLeaveSet(leaves);
  let cur = dayjs(d);

  // Safety cap so a data problem (e.g. every day a "leave") can't loop forever.
  for (let i = 0; i < 3660; i++) {
    const winStart = cur.hour(cfg.workStart).minute(0).second(0).millisecond(0);
    const winEnd = cur.hour(cfg.workEnd).minute(0).second(0).millisecond(0);

    if (isWorkingDay(cur, leaveSet, cfg)) {
      if (cur.isBefore(winStart)) return winStart;
      if (cur.isBefore(winEnd)) return cur;
    }
    cur = cur.add(1, "day").hour(cfg.workStart).minute(0).second(0).millisecond(0);
  }
  return dayjs(d);
}

/* Move `start` later by `hours` of WORKING time. Weekends, leave and
   non-working hours are skipped, so the result always lands inside working
   time. hours <= 0 returns `start` unchanged. */
export function addWorkingHours(start, hours, leaves = [], cfg = DEFAULT_WORK_CFG) {
  const base = dayjs(start);
  if (!base.isValid() || !(hours > 0)) return base;

  const leaveSet = toLeaveSet(leaves);
  let remaining = hours * MS_PER_HOUR;
  let cur = snapToWorkingTime(base, leaves, cfg);

  for (let i = 0; i < 3660 && remaining > 0; i++) {
    const winEnd = cur.hour(cfg.workEnd).minute(0).second(0).millisecond(0);
    const availableToday = winEnd.diff(cur);

    if (remaining <= availableToday) return cur.add(remaining, "ms");

    remaining -= availableToday;
    cur = snapToWorkingTime(
      cur.add(1, "day").hour(cfg.workStart).minute(0).second(0).millisecond(0),
      [...leaveSet],
      cfg,
    );
  }
  return cur;
}

/* "1d 2h 30m" style label for a working-hours figure, using the length of a
   working day (workEnd − workStart) as "1d". */
export function formatWorkingHours(hours, cfg = DEFAULT_WORK_CFG) {
  const perDay = cfg.workEnd - cfg.workStart;
  const totalMin = Math.max(0, Math.round(hours * 60));
  const d = Math.floor(totalMin / (perDay * 60));
  const rest = totalMin - d * perDay * 60;
  const h = Math.floor(rest / 60);
  const m = rest % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || !parts.length) parts.push(`${m}m`);
  return parts.join(" ");
}
