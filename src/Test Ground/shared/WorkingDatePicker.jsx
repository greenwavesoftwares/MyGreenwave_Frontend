import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../useTheme";
import { WORK_START_HR, WORK_END_HR } from "../helpers/constants";
import { parseISODateTime, isoDateTime } from "../helpers/dateUtils";
import { leaveOnDay } from "../helpers/workHours";
import { makeNavBtn, makeTimeSelect, makePickerBtn } from "../helpers/styles";
import TimePickerSection from "./TimePickerSection";

/**
 * Full working-day date + time picker.
 * - Blocks weekends, past dates and leave days
 * - Portal-rendered; positioned relative to `anchorRef`
 * - Closes on outside click, scroll, resize
 */
export default function WorkingDatePicker({
  value,
  onChange,
  resourceUserId,
  groupResources,
  onClose,
  anchorRef,
}) {
  const { t } = useTheme();

  const initial = value
    ? parseISODateTime(value)
    : new Date(2026, 4, 4, WORK_START_HR, 0);

  const [viewDate, setViewDate] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(initial);
  const [hour, setHour] = useState(initial.getHours());
  const [minute, setMinute] = useState(initial.getMinutes());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef();

  // Position popup based on anchor rect
  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popupWidth = 280;
    const popupHeight = 380;

    let top = rect.bottom + window.scrollY + 4;
    let left = rect.left + window.scrollX;

    if (rect.bottom + popupHeight > window.innerHeight) {
      top = rect.top + window.scrollY - popupHeight - 4;
    }
    if (left + popupWidth > window.innerWidth) {
      left = rect.right + window.scrollX - popupWidth;
    }
    setPosition({ top, left });
  }, [anchorRef]);

  // Close on scroll
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [onClose]);

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return;
      onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose, anchorRef]);

  // Reposition on scroll/resize
  useEffect(() => {
    const reposition = () => {
      if (!anchorRef?.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [anchorRef]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(null);

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = useMemo(() => new Date(), []);

  const handleDayClick = (d) => {
    if (!d) return;
    const isWknd = d.getDay() === 0 || d.getDay() === 6;
    const onLeave = leaveOnDay(resourceUserId, d, groupResources);
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const isPast = startOfDay < startOfToday;
    if (isWknd || onLeave || isPast) return;
    setSelectedDate(d);
  };

  const handleConfirm = () => {
    const final = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour,
      minute,
    );
    if (final.getTime() < today.getTime()) {
      alert("Cannot select a date/time in the past.");
      return;
    }
    if (hour > WORK_END_HR || (hour === WORK_END_HR && minute > 0)) {
      alert("Cannot select time after 18:00.");
      return;
    }
    onChange(isoDateTime(final));
    onClose();
  };

  const navBtn = makeNavBtn(t);
  const timeSelect = makeTimeSelect(t);
  const pickerBtn = makePickerBtn(t);

  const popup = (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 99999,
        background: t.bgCard,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 10,
        boxShadow: t.shadowLg,
        padding: 12,
        width: 280,
        fontFamily: "Sora,sans-serif",
      }}
    >
      {/* ── Month + Year nav ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year - 1, month, 1));
          }}
          disabled={year - 1 < today.getFullYear()}
          title="Previous year"
          style={{
            ...navBtn,
            opacity: year - 1 < today.getFullYear() ? 0.3 : 1,
            cursor: year - 1 < today.getFullYear() ? "not-allowed" : "pointer",
          }}
        >
          «
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year, month - 1, 1));
          }}
          disabled={year === today.getFullYear() && month <= today.getMonth()}
          title="Previous month"
          style={{
            ...navBtn,
            opacity:
              year === today.getFullYear() && month <= today.getMonth()
                ? 0.3
                : 1,
            cursor:
              year === today.getFullYear() && month <= today.getMonth()
                ? "not-allowed"
                : "pointer",
          }}
        >
          ‹
        </button>

        <div
          style={{
            display: "flex",
            gap: 4,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <select
            value={month}
            onChange={(e) =>
              setViewDate(new Date(year, Number(e.target.value), 1))
            }
            style={{
              ...timeSelect,
              fontSize: 12,
              fontWeight: 700,
              height: 28,
              padding: "0 6px",
            }}
          >
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((m, i) => {
              const isPastMonth =
                year === today.getFullYear() && i < today.getMonth();
              return (
                <option key={m} value={i} disabled={isPastMonth}>
                  {m}
                </option>
              );
            })}
          </select>

          <select
            value={year}
            onChange={(e) =>
              setViewDate(new Date(Number(e.target.value), month, 1))
            }
            style={{
              ...timeSelect,
              fontSize: 12,
              fontWeight: 700,
              height: 28,
              padding: "0 6px",
            }}
          >
            {Array.from({ length: 11 }, (_, i) => today.getFullYear() + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year, month + 1, 1));
          }}
          title="Next month"
          style={navBtn}
        >
          ›
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(year + 1, month, 1));
          }}
          title="Next year"
          style={navBtn}
        >
          »
        </button>
      </div>

      {/* ── Days grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;

          const day = d.getDay();
          const isWknd = day === 0 || day === 6;
          const onLeave = leaveOnDay(resourceUserId, d, groupResources);
          const startOfDay = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
          );
          const startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          const isPast = startOfDay < startOfToday;
          const disabled = isWknd || onLeave || isPast;
          const selected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);

          let bg = "transparent";
          let color = t.textPrimary;
          let border = "1px solid transparent";
          let cursor = "pointer";

          if (selected) {
            bg = t.primary;
            color = t.textInverse;
            border = `1px solid ${t.primary}`;
          } else if (isPast) {
            bg = t.bgSubtle;
            color = t.textDisabled;
            cursor = "not-allowed";
            border = `1px solid ${t.borderSubtle}`;
          } else if (isWknd) {
            bg = t.dangerBgSubtle;
            color = t.danger;
            cursor = "not-allowed";
            border = `1px solid ${t.dangerBorder}`;
          } else if (onLeave) {
            bg = t.warningBgSubtle;
            color = t.warning;
            cursor = "not-allowed";
            border = `1px solid ${t.warningBorder}`;
          } else if (isToday) {
            border = `1px solid ${t.primary}`;
            color = t.primary;
          }

          return (
            <button
              key={i}
              onClick={() => handleDayClick(d)}
              disabled={disabled}
              title={
                isPast
                  ? "Past date — disabled"
                  : isWknd
                    ? "Weekend — disabled"
                    : onLeave
                      ? `Leave (${onLeave.date})`
                      : ""
              }
              style={{
                aspectRatio: "1",
                border,
                background: bg,
                color,
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: selected || isToday ? 700 : 500,
                cursor,
                fontFamily: "Sora,sans-serif",
                padding: 0,
                opacity: disabled ? 0.6 : 1,
                textDecoration: isPast && !selected ? "line-through" : "none",
                position: "relative",
              }}
            >
              {d.getDate()}
              {onLeave && !selected && !isPast && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: t.warning,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 8,
          fontSize: 9.5,
          color: t.textMuted,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.bgSubtle,
              border: `1px solid ${t.borderSubtle}`,
            }}
          />
          Past
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.dangerBgSubtle,
              border: `1px solid ${t.dangerBorder}`,
            }}
          />
          Weekend
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.warningBgSubtle,
              border: `1px solid ${t.warningBorder}`,
            }}
          />
          Leave
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: t.primary,
            }}
          />
          Selected
        </span>
      </div>

      {/* ── Time picker ── */}
      <TimePickerSection
        selectedDate={selectedDate}
        today={today}
        hour={hour}
        setHour={setHour}
        minute={minute}
        setMinute={setMinute}
      />

      {/* ── Actions ── */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 6,
          justifyContent: "flex-end",
        }}
      >
        <button onClick={onClose} style={pickerBtn}>
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          style={{
            ...pickerBtn,
            background: t.primary,
            color: t.textInverse,
            borderColor: t.primary,
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}
