import React, { useEffect, useMemo, useState } from "react";
import { IconButton } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import dayjs from "dayjs";
import { DEFAULT_WORK_CFG, toLeaveSet } from "./workingTime";

/* ──────────────────────────────────────────────────────────
   DateTimePickerPanel
   Inline month calendar + time selectors (no extra dependency).

   Props
     value     "YYYY-MM-DDTHH:mm" | ""      selected date & time
     onChange  (value: "YYYY-MM-DDTHH:mm")
     minDate   Date | dayjs                 earliest selectable moment
     leaves    leave / holiday dates        shown as unavailable
     workCfg   { workStart, workEnd, weekEnd }
     disabled  boolean

   Unavailable days: before minDate, weekends, leave / holidays, and
   today when working hours are already over. Time options are limited to
   working hours (workStart – workEnd), in 5-minute steps, and never earlier
   than minDate.
   ────────────────────────────────────────────────────────── */

export const PICKER_FMT = "YYYY-MM-DDTHH:mm";
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const STEP = 5;
const pad = (n) => String(n).padStart(2, "0");

const DateTimePickerPanel = ({
  value,
  onChange,
  minDate,
  leaves = [],
  workCfg = DEFAULT_WORK_CFG,
  disabled = false,
}) => {
  const min = useMemo(
    () => dayjs(minDate || undefined).startOf("minute"),
    [minDate],
  );
  const selected = value && dayjs(value).isValid() ? dayjs(value) : null;
  const leaveSet = useMemo(() => toLeaveSet(leaves), [leaves]);

  const [month, setMonth] = useState(() =>
    (selected || min).startOf("month"),
  );
  // Follow the value if it is changed from outside (e.g. default applied).
  useEffect(() => {
    if (selected) setMonth(selected.startOf("month"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const minDecimal = min.hour() + min.minute() / 60;

  const dayDisabled = (d) =>
    d.isBefore(min, "day") ||
    workCfg.weekEnd.includes(d.day()) ||
    leaveSet.has(d.format("YYYY-MM-DD")) ||
    (d.isSame(min, "day") && minDecimal >= workCfg.workEnd);

  // Earliest allowed minute (multiple of STEP) within `hour` on `day`.
  const firstMinute = (day, hour) => {
    if (!day.isSame(min, "day") || hour > min.hour()) return 0;
    if (hour < min.hour()) return null; // whole hour is in the past
    const m = Math.ceil(min.minute() / STEP) * STEP;
    return m >= 60 ? null : m;
  };

  const hours = [];
  for (let h = workCfg.workStart; h < workCfg.workEnd; h++) hours.push(h);
  const minutes = [];
  for (let m = 0; m < 60; m += STEP) minutes.push(m);

  const emit = (d) => onChange?.(d.format(PICKER_FMT));

  const pickDay = (d) => {
    if (disabled || dayDisabled(d)) return;
    let h = selected ? selected.hour() : workCfg.workStart;
    let m = selected ? selected.minute() : 0;
    // keep the previously chosen time unless it is no longer allowed
    let fm = firstMinute(d, h);
    if (fm === null) {
      const next = hours.find((hh) => firstMinute(d, hh) !== null);
      if (next === undefined) return;
      h = next;
      fm = firstMinute(d, h);
      m = fm;
    } else if (m < fm) {
      m = fm;
    }
    emit(d.hour(h).minute(m).second(0).millisecond(0));
  };

  const pickHour = (h) => {
    if (!selected) return;
    const fm = firstMinute(selected, h);
    if (fm === null) return;
    emit(selected.hour(h).minute(Math.max(selected.minute(), fm)));
  };
  const pickMinute = (m) => {
    if (!selected) return;
    emit(selected.minute(m));
  };

  /* ── calendar grid ── */
  const first = month.startOf("month");
  const cells = [];
  for (let i = 0; i < first.day(); i++) cells.push(null);
  for (let i = 0; i < month.daysInMonth(); i++) cells.push(first.add(i, "day"));

  const canGoPrev = !month.isSame(min, "month") && month.isAfter(min, "month");

  return (
    <div className="rsd-cal" onClick={(e) => e.stopPropagation()}>
      <div className="rsd-cal-head">
        <IconButton
          size="small"
          onClick={() => setMonth((m) => m.subtract(1, "month"))}
          disabled={disabled || !canGoPrev}
          aria-label="Previous month"
        >
          <ChevronLeftRoundedIcon fontSize="small" />
        </IconButton>
        <span className="rsd-cal-title">{month.format("MMMM YYYY")}</span>
        <IconButton
          size="small"
          onClick={() => setMonth((m) => m.add(1, "month"))}
          disabled={disabled}
          aria-label="Next month"
        >
          <ChevronRightRoundedIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="rsd-cal-grid rsd-cal-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="rsd-cal-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const off = dayDisabled(d);
          const isSel = selected && d.isSame(selected, "day");
          const isToday = d.isSame(dayjs(), "day");
          const isLeave = leaveSet.has(d.format("YYYY-MM-DD"));
          return (
            <button
              key={d.format("YYYY-MM-DD")}
              type="button"
              disabled={disabled || off}
              onClick={() => pickDay(d)}
              title={
                isLeave
                  ? "Leave / holiday"
                  : workCfg.weekEnd.includes(d.day())
                    ? "Weekend"
                    : undefined
              }
              className={`rsd-cal-day ${isSel ? "rsd-cal-day--sel" : ""} ${
                isToday ? "rsd-cal-day--today" : ""
              } ${off ? "rsd-cal-day--off" : ""} ${
                isLeave ? "rsd-cal-day--leave" : ""
              }`}
            >
              {d.date()}
            </button>
          );
        })}
      </div>

      <div className="rsd-cal-time">
        <span className="rsd-cal-time-label">Time</span>
        <select
          aria-label="Hour"
          className="rsd-cal-select"
          disabled={disabled || !selected}
          value={selected ? selected.hour() : ""}
          onChange={(e) => pickHour(Number(e.target.value))}
        >
          {!selected && <option value="">--</option>}
          {hours.map((h) => (
            <option
              key={h}
              value={h}
              disabled={selected ? firstMinute(selected, h) === null : false}
            >
              {pad(h)}
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          aria-label="Minute"
          className="rsd-cal-select"
          disabled={disabled || !selected}
          value={selected ? Math.floor(selected.minute() / STEP) * STEP : ""}
          onChange={(e) => pickMinute(Number(e.target.value))}
        >
          {!selected && <option value="">--</option>}
          {minutes.map((m) => {
            const fm = selected ? firstMinute(selected, selected.hour()) : 0;
            return (
              <option key={m} value={m} disabled={fm === null || m < fm}>
                {pad(m)}
              </option>
            );
          })}
        </select>
        <span className="rsd-cal-time-hint">
          Working hours {pad(workCfg.workStart)}:00–{pad(workCfg.workEnd)}:00
        </span>
      </div>

      <div className="rsd-cal-foot">
        {selected
          ? selected.format("ddd, DD MMM YYYY · HH:mm")
          : "Pick a day on the calendar"}
      </div>
    </div>
  );
};

export default DateTimePickerPanel;
