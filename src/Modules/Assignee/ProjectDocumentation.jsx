import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ProjectDocumentation.css";
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
import {
  addProjectDocument,
  deleteProjectDocument,
  listProjectDocuments,
  updateProjectDocument,
} from "./projectDocumentsLocalStore";

// Documents are held in the browser (IndexedDB) for now — see
// projectDocumentsLocalStore.js. Keep files modest so the browser store
// stays snappy.
const MAX_UPLOAD_MB = 20;
const MAX_DESCRIPTION_CHARS = 500;

/* =========================
   HELPERS
========================= */

const sameUser = (a, b) =>
  !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();

function formatSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

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

/* =========================
   COMPONENT
========================= */

/**
 * "Project Documentation" dialog opened from a project's detail page.
 *
 * Permissions:
 *  - view / download / add / edit (description or replace file): every
 *    resource assigned to the project
 *  - delete: assigners and co-assigners can delete any document;
 *    everyone else can delete only the documents they created.
 *
 * NOTE: storage is local to this browser for now (IndexedDB), so these
 * rules are UI-level only and documents are NOT shared between users or
 * devices yet. A backend must enforce the same rules when it replaces
 * projectDocumentsLocalStore.js.
 */
export default function ProjectDocumentation({ open, projectId, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [viewingId, setViewingId] = useState(null);
  // Phones get a full-screen sheet instead of a centred 720px dialog.
  const isMobile = useMediaQuery("(max-width: 860px)");
  const documentViewerRef = useRef(null);
  const hasFetchedRef = useRef(false);

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

  const fetchDocuments = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      setDocuments(await listProjectDocuments(projectId));
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

  useEffect(() => {
    hasFetchedRef.current = false;
    setDocuments([]);
    setIsAssigner(false);
    setFormMode(null);
  }, [projectId]);

  // Lazy: nothing is read until the dialog is first opened.
  useEffect(() => {
    if (!open || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchDocuments();
    fetchAssignerRole();
  }, [open, fetchDocuments, fetchAssignerRole]);

  const visibleDocuments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) =>
      [d.fileName, d.description, d.createdByName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [documents, query]);

  const canDelete = (doc) =>
    isAssigner || sameUser(doc.createdById, currentUserId);

  /* ── form ── */
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
    setFormMode(null);
    setEditingDoc(null);
    setFormFile(null);
    setFormDescription("");
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
    const user = { id: currentUserId, name: currentUserName };

    if (formMode === "add" && !formFile) {
      showToast("error", "File required", "Choose a file to upload.");
      return;
    }

    setSaving(true);
    try {
      if (formMode === "add") {
        await addProjectDocument(projectId, {
          file: formFile,
          description: formDescription,
          user,
        });
        showToast("success", "Saved", "Document added.");
      } else if (formMode === "edit" && editingDoc) {
        await updateProjectDocument(editingDoc.id, {
          file: formFile,
          description: formDescription,
          user,
        });
        showToast("success", "Updated", "Document updated.");
      }
      setFormMode(null);
      setEditingDoc(null);
      setFormFile(null);
      setFormDescription("");
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to save document:", err);
      showToast(
        "error",
        "Error",
        "Unable to save the document in this browser. Storage may be full.",
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
      // viewAttachment already toasts on failure.
      await viewAttachment(doc.blob, documentViewerRef, doc.fileName);
    } finally {
      setViewingId(null);
    }
  };

  const handleDownload = (doc) => {
    try {
      const url = window.URL.createObjectURL(doc.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download file", err);
      showToast("error", "Error", "Unable to download file");
    }
  };

  const confirmDelete = async () => {
    const doc = deleteTarget;
    if (!doc) return;
    // Re-check at the moment of action, not just when the button rendered.
    if (!canDelete(doc)) {
      showToast("error", "Not allowed", "You can only delete documents you created.");
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteProjectDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      showToast("success", "Deleted", `${doc.fileName} was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      showToast("error", "Error", "Unable to delete document. Please try again.");
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
              ? `${formFile.name} (${formatSize(formFile.size)})`
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
          const meta = [
            doc.createdByName && `Created by ${doc.createdByName}`,
            formatDate(doc.createdAt),
            formatSize(doc.size),
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
                >
                  <Download size={15} />
                </button>
                <button
                  type="button"
                  className="pdoc-icon-btn"
                  title="Edit"
                  aria-label={`Edit ${doc.fileName}`}
                  onClick={() => openEditForm(doc)}
                >
                  <Pencil size={15} />
                </button>
                {canDelete(doc) && (
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
        // Portal into .pai-page so the --pj-* variables (and their dark
        // mode overrides) are in scope — same as PauseReasonDialog.
        container={() => document.querySelector(".pai-page") || document.body}
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

      <input ref={fileInputRef} type="file" hidden onChange={handleFilePicked} />

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
          this one, and portals into .pai-page. */}
      <DocumentViewer ref={documentViewerRef} hideTrigger />
    </>
  );
}
