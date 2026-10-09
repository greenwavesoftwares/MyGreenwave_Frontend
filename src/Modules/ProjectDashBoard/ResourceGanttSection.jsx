import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import AccordionSection from "./AccordionSection";
import GanttView from "../../Test Ground/GanttView/index";
import activityTrackerApi from "../../Services/activityTrackerApi";
import { addComment } from "../../Modules/Assignee/AssigneeHelper";
import CommentsActionDialog from "../../Modules/Assignee/CommentsActionDialog";

/**
 * Resource Gantt Section
 */
function ResourceGanttSection({ t, filteredProjectsData, showToast }) {
  // ─── Comments ───
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [existingComments, setExistingComments] = useState([]);
  const [newComment, setNewComment] = useState(null);
  const [rowData, setRowData] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const onOpenCommentBox = useCallback(
    async (row, projectId, activityId, moduleId) => {
      try {
        const existingCommentsResp =
          await activityTrackerApi.getCommentReplyTreeByProjectIdAndActivityId(
            projectId,
            activityId,
          );
        const newCommentBody = addComment(projectId, activityId, moduleId);
        const currentProject = filteredProjectsData?.find(
          (d) => d.id === row._projectId,
        );
        setCurrentProject(currentProject);
        setRowData(row);
        setExistingComments(existingCommentsResp || []);
        setNewComment(newCommentBody);
        setOpenCommentDialog(true);
      } catch (err) {
        showToast("error", "Failed to load comments", err.message);
      }
    },
    [showToast],
  );
  return (
    <>
      <AccordionSection title="Resource Gantt" t={t} defaultOpen>
        <GanttView
          projects={filteredProjectsData}
          onOpenComments={
            (row) => onOpenCommentBox(row, row._projectId, row.id, row.moduleId)
            // console.log("Row : ", row)
          }
        />
      </AccordionSection>
      {/* ══ MODALS ══ */}
      {openCommentDialog && newComment && (
        <CommentsActionDialog
          open={openCommentDialog}
          onClose={() => setOpenCommentDialog(false)}
          existingComments={existingComments}
          setExistingComments={setExistingComments}
          newComment={newComment}
          setNewComment={setNewComment}
          allowActions={currentProject?.status?.toLowerCase() !== "closed"}
          activityName={rowData?.task || "—"}
        />
      )}
    </>
  );
}

export default ResourceGanttSection;
