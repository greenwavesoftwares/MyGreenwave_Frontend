import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./assignee-theme.css"; // REFACTOR: shared --pj-* tokens + reset
import "./ProjectDocumentation.css";
import { getPortalContainer } from "./portalContainer";
import dayjs from "dayjs";
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File as FileIcon,
  Mail,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Dialog, useMediaQuery } from "@mui/material";
import activityTrackerApi from "../../Services/activityTrackerApi";
import DocumentViewer from "./DocumentViewer";
import { viewAttachment } from "./AttachmentHelper";
import { showToast } from "./toastService";
import ConfirmDialog from "./ConfirmDialog";
import { getUserData } from "../Login/Encrypt";

// Keep in sync with the backend multipart limit
// (e.g. spring.servlet.multipart.max-file-size).
const MAX_UPLOAD_MB = 20;
const MAX_DESCRIPTION_CHARS = 500;

/* =========================
   HELPERS
========================= */

const sameUser = (a, b) =>
  !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();

// REFACTOR: getPortalContainer now lives in ./portalContainer.js (shared by
// every dialog) and no longer looks for `.pai-page`.

function formatDate(value) {
  return value && dayjs(value).isValid()
    ? dayjs(value).format("D MMM YYYY, HH:mm")
    : "";
}

function getFileVisual(fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext)) return { Icon: FileText, tone: "red" };
  if (["doc", "docx", "txt", "md", "log", "json"].includes(ext))
    return { Icon: FileText, tone: "blue" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { Icon: FileSpreadsheet, tone: "green" };
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return { Icon: FileImage, tone: "purple" };
  if (["eml", "msg"].includes(ext)) return { Icon: Mail, tone: "amber" };
  if (["zip", "rar", "7z"].includes(ext))
    return { Icon: FileArchive, tone: "amber" };
  return { Icon: FileIcon, tone: "slate" };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Result is a data URL ("data:<mime>;base64,<data>"); the API accepts it.
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function triggerBrowserDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/* =========================
   COMPONENT
========================= */

/**
 * "Project Documentation" dialog opened from a project's detail page.
 *
 * Permissions (the backend is the authority; the checks here only decide
 * which buttons to show):
 *  - view / download / add / edit (description or replace file): every
 *    resource assigned to the project
 *  - delete: assigners and co-assigners can delete any document;
 *    everyone else can delete only the documents they created.
 */
export default function ProjectDocumentation({ open, projectId, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [viewingId, setViewingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  // Phones get a full-screen sheet instead of a centred 720px dialog.
  const isMobile = useMediaQuery("(max-width: 860px)");
  const documentViewerRef = useRef(null);

  const currentUser = getUserData()?.userDetails;
  const currentUserId = currentUser?.userId;
  const currentUserName = currentUser?.userName || currentUserId;
  const [isAssigner, setIsAssigner] = useState(false);

  // Add / edit form. formMode: null | "add" | "edit".
  const [formMode, setFormMode] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formFile, setFormFile] = useState(null);
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── data loading ── */
  const fetchDocuments = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await activityTrackerApi.getDocumentsByProjectId(projectId);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load project documents:", err);
      setError("Unable to load project documentation. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Is the current user an assigner/co-assigner on this project? Existing
  // endpoint the feedback screen already uses. If it fails we fall back to
  // the stricter employee rules (delete own documents only).
  const fetchAssignerRole = useCallback(async () => {
    if (!projectId) return;
    try {
      const assigners =
        await activityTrackerApi.getAssigneeAssignerInfoByProjectId(projectId);
      setIsAssigner(
        (assigners ?? []).some((a) =>
          sameUser(a.id ?? a.assignerId, currentUserId),
        ),
      );
    } catch (err) {
      console.error("Failed to resolve assigner role:", err);
      setIsAssigner(false);
    }
  }, [projectId, currentUserId]);

  // Reset local state when switching projects.
  useEffect(() => {
    setDocuments([]);
    setIsAssigner(false);
    setFormMode(null);
    setEditingDoc(null);
    setQuery("");
  }, [projectId]);

  // Load every time the dialog opens (nothing is requested while it is
  // closed), so the list is always fresh when "Knowledge Base" is clicked.
  useEffect(() => {
    if (!open || !projectId) return;
    fetchDocuments();
    fetchAssignerRole();
  }, [open, projectId, fetchDocuments, fetchAssignerRole]);

  const visibleDocuments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) =>
      [d.fileName, d.description, d.createdByName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [documents, query]);

  const canUpdateDelete = (doc) =>
    isAssigner || sameUser(doc.createdById, currentUserId);

  /* ── form ── */
  const resetForm = () => {
    setFormMode(null);
    setEditingDoc(null);
    setFormFile(null);
    setFormDescription("");
  };

  const openAddForm = () => {
    setEditingDoc(null);
    setFormFile(null);
    setFormDescription("");
    setFormMode("add");
  };

  const openEditForm = (doc) => {
    setEditingDoc(doc);
    setFormFile(null);
    setFormDescription(doc.description ?? "");
    setFormMode("edit");
  };

  const closeForm = () => {
    if (saving) return;
    resetForm();
  };

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      showToast(
        "error",
        "File too large",
        `${file.name} is larger than ${MAX_UPLOAD_MB} MB.`,
      );
      return;
    }
    setFormFile(file);
  };

  const handleSave = async () => {
    if (saving) return;

    if (formMode === "add" && !formFile) {
      showToast("error", "File required", "Choose a file to upload.");
      return;
    }

    setSaving(true);
    try {
      // The backend reads the creator/updater from the auth token.
      // Files travel as Base64 inside JSON; omit file fields to change
      // only the description.
      const payload = { description: formDescription.trim() };
      if (formFile) {
        payload.fileBase64 = await fileToBase64(formFile);
        payload.fileName = formFile.name;
      }

      if (formMode === "add") {
        await activityTrackerApi.addDocument(projectId, payload);
        showToast("success", "Saved", "Document added.");
      } else if (formMode === "edit" && editingDoc) {
        await activityTrackerApi.updateDocument(editingDoc.id, payload);
        showToast("success", "Updated", "Document updated.");
      }
      resetForm();
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to save document:", err);
      showToast(
        "error",
        "Error",
        err?.response?.status === 413
          ? `The file is too large. The limit is ${MAX_UPLOAD_MB} MB.`
          : "Unable to save the document. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── view / download / delete ── */
  const handleView = async (doc) => {
    if (viewingId) return;
    setViewingId(doc.id);
    try {
      const blob = await activityTrackerApi.downloadDocument(doc.id);
      // viewAttachment already toasts on its own failures.
      await viewAttachment(blob, documentViewerRef, doc.fileName);
    } catch (err) {
      console.error("Failed to open file", err);
      showToast("error", "Error", "Unable to open file");
    } finally {
      setViewingId(null);
    }
  };

  const handleDownload = async (doc) => {
    if (downloadingId) return;
    setDownloadingId(doc.id);
    try {
      const blob = await activityTrackerApi.downloadDocument(doc.id);
      triggerBrowserDownload(blob, doc.fileName);
    } catch (err) {
      console.error("Failed to download file", err);
      showToast("error", "Error", "Unable to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    const doc = deleteTarget;
    if (!doc) return;
    // Re-check at the moment of action, not just when the button rendered.
    if (!canUpdateDelete(doc)) {
      showToast(
        "error",
        "Not allowed",
        "You can only delete documents you created.",
      );
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await activityTrackerApi.deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      showToast("success", "Deleted", `${doc.fileName} was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      if (err?.response?.status === 403) {
        showToast(
          "error",
          "Not allowed",
          "You can only delete documents you created.",
        );
        setDeleteTarget(null);
      } else {
        showToast(
          "error",
          "Error",
          "Unable to delete document. Please try again.",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  /* ── render ── */
  const renderForm = () => (
    <div className="pdoc-form">
      <div className="pdoc-form-title">
        {formMode === "edit" ? "Edit document" : "Add document"}
      </div>

      <div className="pdoc-form-row">
        <span className="pdoc-form-label">
          {formMode === "edit" ? "Replace file (optional)" : "File"}
        </span>
        <div className="pdoc-file-picker">
          <button
            type="button"
            className="pdoc-choose-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            <Paperclip size={13} />
            {formFile ? "Change file" : "Choose file"}
          </button>
          <span
            className="pdoc-file-picker-name"
            title={formFile?.name || editingDoc?.fileName}
          >
            {formFile
              ? formFile.name
              : formMode === "edit"
                ? `Current: ${editingDoc?.fileName}`
                : "No file chosen"}
          </span>
        </div>
      </div>

      <div className="pdoc-form-row">
        <label className="pdoc-form-label" htmlFor="pdoc-desc">
          Description
        </label>
        <textarea
          id="pdoc-desc"
          className="pdoc-textarea"
          rows={3}
          maxLength={MAX_DESCRIPTION_CHARS}
          placeholder="What is this document about?"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          disabled={saving}
        />
        <span className="pdoc-form-hint">
          {formDescription.length}/{MAX_DESCRIPTION_CHARS}
        </span>
      </div>

      <div className="pdoc-form-footer">
        <span className="pdoc-form-createdby">
          {formMode === "edit"
            ? `Created by ${editingDoc?.createdByName || "—"}`
            : `Created by ${currentUserName || "—"}`}
        </span>
        <div className="pdoc-form-buttons">
          <button
            type="button"
            className="pdoc-btn pdoc-btn--ghost"
            onClick={closeForm}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pdoc-btn pdoc-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <span className="pdoc-spinner pdoc-spinner--sm" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderList = () => {
    if (loading) {
      return (
        <div className="pdoc-state">
          <span className="pdoc-spinner" />
          <p className="pdoc-state-title">Loading documentation…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="pdoc-state pdoc-state--error">
          <p className="pdoc-state-title">{error}</p>
          <button className="pdoc-retry" onClick={fetchDocuments}>
            Try again
          </button>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="pdoc-state">
          <BookOpen size={30} strokeWidth={1.3} />
          <p className="pdoc-state-title">No documentation yet</p>
          <p className="pdoc-state-sub">
            Use Upload to add a document for this project.
          </p>
        </div>
      );
    }

    if (visibleDocuments.length === 0) {
      return (
        <div className="pdoc-state">
          <p className="pdoc-state-title">No documents match “{query}”</p>
        </div>
      );
    }

    return (
      <ul className="pdoc-list">
        {visibleDocuments.map((doc) => {
          const { Icon, tone } = getFileVisual(doc.fileName);
          const isViewing = viewingId === doc.id;
          const isDownloading = downloadingId === doc.id;
          const meta = [
            doc.createdByName && `Created by ${doc.createdByName}`,
            formatDate(doc.createdAt),
          ].filter(Boolean);
          const updatedMeta = doc.updatedAt
            ? `Updated${doc.updatedByName ? ` by ${doc.updatedByName}` : ""} · ${formatDate(doc.updatedAt)}`
            : null;

          return (
            <li className="pdoc-item" key={doc.id}>
              <div className={`pdoc-file-icon pdoc-file-icon--${tone}`}>
                <Icon size={18} strokeWidth={1.8} />
              </div>

              <div className="pdoc-item-main">
                <button
                  type="button"
                  className="pdoc-item-name"
                  title={doc.fileName}
                  onClick={() => handleView(doc)}
                  disabled={isViewing}
                >
                  {doc.fileName}
                </button>
                {doc.description && (
                  <span className="pdoc-item-desc">{doc.description}</span>
                )}
                {meta.length > 0 && (
                  <span className="pdoc-item-meta">{meta.join("  ·  ")}</span>
                )}
                {updatedMeta && (
                  <span className="pdoc-item-meta">{updatedMeta}</span>
                )}
              </div>

              <div className="pdoc-actions">
                <button
                  type="button"
                  className="pdoc-icon-btn"
                  title="View"
                  aria-label={`View ${doc.fileName}`}
                  onClick={() => handleView(doc)}
                  disabled={isViewing}
                >
                  {isViewing ? (
                    <span className="pdoc-spinner pdoc-spinner--sm" />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
                <button
                  type="button"
                  className="pdoc-icon-btn"
                  title="Download"
                  aria-label={`Download ${doc.fileName}`}
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <span className="pdoc-spinner pdoc-spinner--sm" />
                  ) : (
                    <Download size={15} />
                  )}
                </button>
                {canUpdateDelete(doc) && (
                  <button
                    type="button"
                    className="pdoc-icon-btn"
                    title="Edit"
                    aria-label={`Edit ${doc.fileName}`}
                    onClick={() => openEditForm(doc)}
                  >
                    <Pencil size={15} />
                  </button>
                )}
                {canUpdateDelete(doc) && (
                  <button
                    type="button"
                    className="pdoc-icon-btn pdoc-icon-btn--danger"
                    title="Delete"
                    aria-label={`Delete ${doc.fileName}`}
                    onClick={() => setDeleteTarget(doc)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <Dialog
        open={!!open}
        onClose={onClose}
        maxWidth={false}
        fullScreen={isMobile}
        className="pj-scope pdoc-root"
        // Portal next to the nearest themed ancestor so the app's theme
        // variables (.light/.dark, data-theme) still apply. `pj-scope`
        // supplies the --pj-* tokens, so no page wrapper is needed.
        container={getPortalContainer}
        PaperProps={{ className: "pdoc-paper" }}
      >
        <div className="pdoc-header">
          <div className="pdoc-header-title">
            <span className="pdoc-section-icon">
              <BookOpen size={14} />
            </span>
            <h2 className="pdoc-title">Knowledge Base</h2>
            <span className="pdoc-counter">{documents.length}</span>
          </div>

          <div className="pdoc-header-tools">
            {documents.length > 0 && (
              <div className="pdoc-search">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search documents…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}
            <button
              type="button"
              className="pdoc-upload-btn"
              onClick={openAddForm}
              disabled={saving || formMode === "add"}
            >
              <Plus size={14} />
              Upload
            </button>
            <button
              type="button"
              className="pdoc-icon-btn pdoc-icon-btn--bordered"
              title="Refresh"
              aria-label="Refresh documentation"
              onClick={fetchDocuments}
              disabled={loading}
            >
              {loading ? (
                <span className="pdoc-spinner pdoc-spinner--sm" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
            <button
              type="button"
              className="pdoc-icon-btn pdoc-icon-btn--bordered"
              title="Close"
              aria-label="Close documentation"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="pdoc-body">
          {formMode && renderForm()}
          {renderList()}
        </div>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFilePicked}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete document?"
        message={`“${deleteTarget?.fileName ?? ""}” will be removed from this project.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Mounted imperatively via documentViewerRef (same pattern as the
          comments dialog). Its own Dialog sits at z-index 1400, above
          this one, and portals via getPortalContainer. */}
      <DocumentViewer ref={documentViewerRef} hideTrigger />
    </>
  );
}
