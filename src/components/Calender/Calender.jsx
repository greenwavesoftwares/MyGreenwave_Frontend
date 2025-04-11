import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!
import interactionPlugin from "@fullcalendar/interaction";

const Calender = ({ initialView, height, events, eventMouseEnter }) => {
  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView={initialView}
        height={height}
        events={events}
        eventMouseEnter={eventMouseEnter}
      />
    </>
  );
};

export default Calender;
