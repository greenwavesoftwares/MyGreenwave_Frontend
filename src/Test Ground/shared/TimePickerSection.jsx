import React, { useEffect } from "react";
import { useTheme } from "../useTheme";
import { WORK_START_HR, WORK_END_HR } from "../helpers/constants";
import { makeTimeSelect } from "../helpers/styles";

/**
 * Hour + minute selector shown at the bottom of WorkingDatePicker.
 * Filters out past times when the selected date is today.
 */
export default function TimePickerSection({
  selectedDate,
  today,
  hour,
  setHour,
  minute,
  setMinute,
}) {
  const { t } = useTheme();

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isSelectedToday = isSameDay(selectedDate, today);
  const nowHour = today.getHours();
  const nowMinute = today.getMinutes();

  const minHour = isSelectedToday
    ? Math.max(WORK_START_HR, nowHour)
    : WORK_START_HR;

  const hourOptions = Array.from(
    { length: WORK_END_HR - WORK_START_HR + 1 },
    (_, i) => WORK_START_HR + i,
  ).filter((h) => h >= minHour);

  const minuteOptions = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59,
  ].filter((m) => {
    if (hour === WORK_END_HR) return m === 0;
    if (isSelectedToday && hour === nowHour) return m > nowMinute;
    return true;
  });

  // Auto-correct invalid hour/minute when switching to TODAY
  useEffect(() => {
    if (!isSelectedToday) return;

    let newHour = hour;
    let newMinute = minute;

    if (newHour < minHour) {
      newHour = minHour;
      newMinute = 0;
    }

    if (newHour === WORK_END_HR && newMinute > 0) {
      newMinute = 0;
    }

    if (newHour === nowHour && newMinute <= nowMinute) {
      const nextValid = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59].find(
        (m) => {
          if (newHour === WORK_END_HR) return m === 0 && m > nowMinute;
          return m > nowMinute;
        },
      );
      if (nextValid !== undefined) {
        newMinute = nextValid;
      } else if (newHour + 1 <= WORK_END_HR) {
        newHour = newHour + 1;
        newMinute = 0;
      }
    }

    if (newHour !== hour) setHour(newHour);
    if (newMinute !== minute) setMinute(newMinute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectedToday]);

  const timeSelect = makeTimeSelect(t);

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
        Time:
      </span>

      <select
        value={hour}
        onChange={(e) => setHour(Number(e.target.value))}
        style={timeSelect}
      >
        {hourOptions.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, "0")}
          </option>
        ))}
      </select>

      <span style={{ fontWeight: 700, color: t.textMuted }}>:</span>

      <select
        value={minute}
        onChange={(e) => setMinute(Number(e.target.value))}
        style={timeSelect}
        disabled={minuteOptions.length === 0}
      >
        {minuteOptions.length > 0 ? (
          minuteOptions.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))
        ) : (
          <option value="">—</option>
        )}
      </select>

      <span style={{ fontSize: 10, color: t.textFaint, marginLeft: 4 }}>
        (Work: {WORK_START_HR}:00–{WORK_END_HR}:00)
      </span>
    </div>
  );
}
