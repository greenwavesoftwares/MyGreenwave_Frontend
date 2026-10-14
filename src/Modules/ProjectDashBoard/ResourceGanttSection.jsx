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
import FeedbackModal from "../../Test Ground/FeedbackModal";
import ProjectStatusTabs from "./ProjectStatusTabs";

/**
 * Resource Gantt Section
 */
function ResourceGanttSection({ t, filteredProjectsData, showToast,ganttSelection, handleGanttSelectionChange ,isDark}) {
  // ─── Comments ───
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [existingComments, setExistingComments] = useState([]);
  const [newComment, setNewComment] = useState(null);
  const [rowData, setRowData] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [ganttFeedbackRow, setGanttFeedbackRow] = useState(null);

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
  const handleGanttViewFeedback = useCallback((row) => {
    const status = String(row.status || "")
      .toLowerCase()
      .trim();
    if (status !== "finished") return;
    setGanttFeedbackRow(row);
  }, []);
  return (
    <>
      <AccordionSection title="Resource Gantt" t={t} defaultOpen>
          <ProjectStatusTabs
        ganttSelection={ganttSelection}
        handleGanttSelectionChange={handleGanttSelectionChange}
        isDark={isDark}
      />
        <GanttView
          projects={filteredProjectsData}
          onOpenComments={
            (row) => onOpenCommentBox(row, row._projectId, row.id, row.moduleId)
            // console.log("Row : ", row)
          }
          onFeedback={handleGanttViewFeedback}
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
      {ganttFeedbackRow && (
        <FeedbackModal
          row={ganttFeedbackRow}
          onClose={() => setGanttFeedbackRow(null)}
          onConfirm={() => {}}
          isSubmitting={false}
        />
      )}
    </>
  );
}

export default ResourceGanttSection;
