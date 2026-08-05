import React from "react";
import AccordionSection from "./AccordionSection";
import GanttView from "../../Test Ground/GanttView";

/**
 * Resource Gantt Section
 */
function ResourceGanttSection({
  t,
  filteredProjectsData
}) {
  
  return (
    <AccordionSection title="Resource Gantt" t={t} defaultOpen>
      <GanttView projects={filteredProjectsData}/>
    </AccordionSection>
  );
}

export default ResourceGanttSection;
