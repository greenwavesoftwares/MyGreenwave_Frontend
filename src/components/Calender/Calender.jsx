import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!

const Calender = ({ initialView, height }) => {
  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView={initialView}
        height={height}
      />
    </>
  );
};

export default Calender;
