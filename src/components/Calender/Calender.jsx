import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!
import interactionPlugin from "@fullcalendar/interaction";

const Calender = ({
  initialView,
  height,
  events,
  eventMouseEnter,
  eventMouseLeave,
  eventContent,
  eventBackgroundColor,
  eventBorderColor,
  eventTextColor,
}) => {
  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView={initialView}
        height={height}
        events={events}
        eventMouseEnter={eventMouseEnter}
        eventMouseLeave={eventMouseLeave}
        eventContent={eventContent}
        eventBackgroundColor={eventBackgroundColor}
        eventBorderColor={eventBorderColor}
        eventTextColor={eventTextColor}
      />
    </>
  );
};

export default Calender;
