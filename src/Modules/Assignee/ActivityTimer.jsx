import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

export default function ActivityTimer({ plannedStop ,status}) {
  const [display, setDisplay] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    console.log("Planned stop",plannedStop)
    if (status==='Completed' || status==='Finished') {
        console.log("Inside check")
      setDisplay("—");
      return;
    }

    const tick = () => {
  const now = dayjs();
  const end = dayjs(plannedStop);

  const diffSecs = end.diff(now, "second");
  const overdue = diffSecs < 0;

  setIsOverdue(overdue);

  const absSecs = Math.abs(diffSecs);

  const days = Math.floor(absSecs / (24 * 3600));
  const hours = Math.floor((absSecs % (24 * 3600)) / 3600);
  const minutes = Math.floor((absSecs % 3600) / 60);
  const seconds = absSecs % 60;

  let formatted = "";

  if (days > 0) {
    formatted = `${days}d ${String(hours).padStart(2, "0")}h ${String(
      minutes
    ).padStart(2, "0")}m`;
  } else if (hours > 0) {
    formatted = `${hours}h ${String(minutes).padStart(2, "0")}m ${String(
      seconds
    ).padStart(2, "0")}s`; //adds 0 if length less than 2
  } else {
    formatted = `${String(minutes).padStart(2, "0")}m ${String(
      seconds
    ).padStart(2, "0")}s`;//adds 0 if length less than 2
  }

  setDisplay((overdue ? "+" : "") + formatted);
};
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [plannedStop]);

  if (!display || display === "—") return <span className="timer-dash">—</span>;

  return (
    <span className={`activity-timer ${isOverdue ? "timer-overdue" : "timer-countdown"}`}>
      <span className="timer-dot" />
      {display}
    </span>
  );
}
