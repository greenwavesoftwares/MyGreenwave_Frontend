import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Plus,
  X,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Check,
  ClipboardList,
  AlertTriangle,
  Info,
  Paperclip,
  Copy,
  File,
  Image,
  FileSpreadsheet,
  Upload,
  Lock,
  Users,
  Share2,
  Loader2,
  RefreshCw,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import ShareModal from "./ShareModal";
import ManageSharingModal from "./ManageSharingModal";
import * as sharingApi from "./sharingApi";
import { useOptimisticSharing } from "./useOptimisticSharing";
import { findUserById } from "./updatesHelpers";

/* ─── Default Template Categories ─── */
const DEFAULT_CATEGORIES = [
  "Detail Engineering",
  "Manufacturing",
  "Billing",
  "Offsite Development",
  "Deployment",
  "Site Progress",
  "Payment",
  "Ongoing Discussion",
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/* ─── Date Utilities ─── */
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSnapshotPast(snapshotDate) {
  if (!snapshotDate) return false;
  return snapshotDate < todayISO();
}

/* ─── File Utilities ─── */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(fileName) {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return Image;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["doc", "docx", "pdf", "txt"].includes(ext)) return FileText;
  return File;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Shared Styles ─── */
const btnStyle = {
  height: 32,
  padding: "0 14px",
  borderRadius: 7,
  border: "1px solid #CBD5E1",
  background: "#fff",
  color: "#475569",
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  transition: "all .12s",
};

const inputStyle = {
  width: "100%",
  height: 34,
  border: "1px solid #CBD5E1",
  borderRadius: 6,
  background: "#fff",
  color: "#0F172A",
  padding: "0 10px",
  fontFamily: "Sora,sans-serif",
  fontSize: 12,
  boxSizing: "border-box",
  outline: "none",
};

/* ═══════════════════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: 20,
        fontFamily: "Sora,sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 40,
          gap: 12,
        }}
      >
        <Loader2
          size={32}
          style={{
            animation: "spin 1s linear infinite",
            color: "#1D4ED8",
          }}
        />
        <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
          Loading updates...
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>
          Fetching categories, snapshots, and sharing info
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Error State
   ═══════════════════════════════════════════════════════ */
function ErrorState({ error, onRetry }) {
  const isNetwork = error?.isNetworkError;
  const isPermission = error?.isPermissionError;
  const isNotFound = error?.isNotFound;

  let Icon = AlertCircle;
  let title = "Failed to load updates";
  let bgColor = "#FEF2F2";
  let borderColor = "#FCA5A5";
  let iconColor = "#DC2626";
  let iconBg = "#FEE2E2";

  if (isNetwork) {
    Icon = WifiOff;
    title = "Connection Problem";
  } else if (isPermission) {
    Icon = Lock;
    title = "Access Denied";
    bgColor = "#FFFBEB";
    borderColor = "#FCD34D";
    iconColor = "#B45309";
    iconBg = "#FEF3C7";
  } else if (isNotFound) {
    Icon = AlertCircle;
    title = "Not Found";
  }

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: 24,
        fontFamily: "Sora,sans-serif",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "#0F172A",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#475569",
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          {error?.userMessage || error?.message || "An unknown error occurred."}
        </div>
        {error?.code && (
          <div
            style={{
              display: "inline-block",
              padding: "3px 8px",
              background: "rgba(0,0,0,0.05)",
              borderRadius: 4,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#64748B",
              marginBottom: 12,
            }}
          >
            {error.code}
          </div>
        )}
        {onRetry && !isPermission && (
          <button
            onClick={onRetry}
            style={{
              ...btnStyle,
              background: "#DC2626",
              color: "#fff",
              borderColor: "#DC2626",
            }}
          >
            <RefreshCw size={13} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Inline Saving Badge
   ═══════════════════════════════════════════════════════ */
function InlineSaving({ show, label = "Saving..." }) {
  if (!show) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        background: "#F0F9FF",
        color: "#0369A1",
        border: "1px solid #BAE6FD",
        borderRadius: 5,
        fontSize: 10.5,
        fontWeight: 600,
        marginTop: 4,
      }}
    >
      <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
      {label}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   File Attachment Badge
   ═══════════════════════════════════════════════════════ */
function FileAttachmentBadge({ file, onRemove, readOnly, size = "sm" }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!file) return null;
  const FileIcon = getFileIcon(file.name);
  const isSmall = size === "sm";

  const handleDownload = async (e) => {
    e.stopPropagation();

    // If file has MinIO key, download from server
    if (file.key) {
      setIsDownloading(true);
      try {
        await sharingApi.downloadAndSaveFile(file.key, file.name);
      } catch (err) {
        console.error("Download failed:", err);
        // Show error via global toast if available
        if (window.__showToast) {
          window.__showToast(
            "error",
            "Download failed",
            err.userMessage || err.message,
          );
        }
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    // If file has raw base64 data (still being uploaded, not yet saved)
    if (file.data) {
      const link = document.createElement("a");
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: isSmall ? "3px 8px" : "5px 10px",
        background: "#F0F9FF",
        border: "1px solid #BAE6FD",
        borderRadius: 6,
        fontSize: isSmall ? 10.5 : 11.5,
        color: "#0369A1",
        maxWidth: "100%",
        opacity: isDownloading ? 0.6 : 1,
      }}
    >
      {isDownloading ? (
        <Loader2
          size={isSmall ? 11 : 13}
          style={{
            flexShrink: 0,
            animation: "spin 1s linear infinite",
          }}
        />
      ) : (
        <FileIcon size={isSmall ? 11 : 13} style={{ flexShrink: 0 }} />
      )}
      <span
        onClick={handleDownload}
        title={`Download ${file.name}`}
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: 600,
          cursor: isDownloading ? "wait" : "pointer",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
        }}
      >
        {isDownloading ? "Downloading..." : file.name}
      </span>
      {!isSmall && file.size && (
        <span style={{ color: "#64748B", fontSize: 10 }}>
          ({formatFileSize(file.size)})
        </span>
      )}
      {!readOnly && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove attachment"
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            border: "none",
            background: "rgba(220,38,38,0.1)",
            color: "#DC2626",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            marginLeft: 2,
          }}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Note Editor
   ═══════════════════════════════════════════════════════ */
function NoteEditor({
  initialText,
  initialFile,
  onSave,
  onCancel,
  showToast,
  isSaving = false,
}) {
  const [text, setText] = useState(initialText || "");
  const [file, setFile] = useState(initialFile);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      showToast?.(
        "error",
        "File too large",
        `Maximum file size is ${MAX_FILE_SIZE_MB} MB.`,
      );
      e.target.value = "";
      return;
    }
    setIsUploading(true);
    try {
      const base64 = await readFileAsBase64(selectedFile);
      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        data: base64,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err) {
      showToast?.("error", "Upload failed", err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = () => {
    if (!text.trim()) {
      showToast?.("error", "Cannot save", "Note text cannot be empty.");
      return;
    }
    onSave({ text: text.trim(), file });
  };

  const isDisabled = isSaving || isUploading;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {!file ? (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
              style={{
                ...btnStyle,
                height: 28,
                fontSize: 11,
                padding: "0 10px",
                color: "#0369A1",
                borderColor: "#BAE6FD",
                background: "#F0F9FF",
                opacity: isDisabled ? 0.6 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? (
                <>
                  <Loader2
                    size={11}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Paperclip size={11} /> Attach File
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </>
        ) : (
          <FileAttachmentBadge
            file={file}
            onRemove={() => !isDisabled && setFile(null)}
            readOnly={isDisabled}
            size="sm"
          />
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your update note..."
        rows={4}
        disabled={isDisabled}
        style={{
          ...inputStyle,
          height: "auto",
          minHeight: 80,
          resize: "vertical",
          paddingTop: 8,
          fontSize: 12,
          lineHeight: 1.5,
          background: isDisabled ? "#F8FAFC" : "#fff",
        }}
      />

      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          disabled={isDisabled}
          style={{
            ...btnStyle,
            height: 28,
            fontSize: 11,
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          <X size={11} /> Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!text.trim() || isDisabled}
          style={{
            ...btnStyle,
            height: 28,
            fontSize: 11,
            background: text.trim() && !isDisabled ? "#1D4ED8" : "#F1F5F9",
            color: text.trim() && !isDisabled ? "#fff" : "#94A3B8",
            borderColor: text.trim() && !isDisabled ? "#1D4ED8" : "#E2E8F0",
            cursor: text.trim() && !isDisabled ? "pointer" : "not-allowed",
          }}
        >
          {isSaving ? (
            <>
              <Loader2
                size={11}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Saving...
            </>
          ) : (
            <>
              <Check size={11} /> Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Note Display
   ═══════════════════════════════════════════════════════ */
function NoteDisplay({ note, canEdit, isPastSnapshot, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(note.text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const canModify = canEdit && !isPastSnapshot;
  const authorUser = findUserById(note.author);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
          minHeight: 22,
        }}
      >
        <div
          className="note-actions"
          style={{
            display: "flex",
            gap: 3,
            opacity: 0,
            transition: "opacity .12s",
          }}
        >
          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy text"}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              border: `1px solid ${copied ? "#86EFAC" : "#E2E8F0"}`,
              background: copied ? "#DCFCE7" : "#fff",
              cursor: "pointer",
              color: copied ? "#15803D" : "#64748B",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
          {canModify && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Edit note"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  cursor: "pointer",
                  color: "#64748B",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <Edit size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete note"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: "1px solid #FCA5A5",
                  background: "#FEF2F2",
                  cursor: "pointer",
                  color: "#EF4444",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <Trash2 size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#0F172A",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {note.text}
      </div>

      {note.file && (
        <FileAttachmentBadge file={note.file} readOnly={true} size="sm" />
      )}

      {(authorUser || note.authorName) && (
        <div
          style={{
            fontSize: 9.5,
            color: "#94A3B8",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 2,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#DBEAFE",
              color: "#1D4ED8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 700,
            }}
          >
            {(authorUser?.userName || note.authorName || "?")
              .charAt(0)
              .toUpperCase()}
          </span>
          {authorUser?.userName || note.authorName || note.author}
        </div>
      )}

      {isPastSnapshot && canEdit && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            background: "#F1F5F9",
            color: "#64748B",
            border: "1px solid #CBD5E1",
            borderRadius: 4,
            fontSize: 9.5,
            fontWeight: 600,
            width: "fit-content",
            marginTop: 2,
          }}
        >
          <Lock size={9} /> Archived
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Confirm Delete Modal
   ═══════════════════════════════════════════════════════ */
function ConfirmDeleteModal({
  title,
  message,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  return (
    <div
      onClick={(e) => !isDeleting && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          width: "100%",
          maxWidth: 400,
          fontFamily: "Sora,sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "#FEF2F2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
              {title}
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
              {message}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              ...btnStyle,
              opacity: isDeleting ? 0.6 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              ...btnStyle,
              background: "#DC2626",
              color: "#fff",
              borderColor: "#DC2626",
              opacity: isDeleting ? 0.7 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            {isDeleting ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={13} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Add Snapshot Modal
   ═══════════════════════════════════════════════════════ */
function AddSnapshotModal({
  existingSnapshots,
  onClose,
  onConfirm,
  isSaving = false,
}) {
  const [date, setDate] = useState(todayISO());
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!date) return setError("Please select a date");
    if (existingSnapshots.some((s) => s.date === date))
      return setError("A snapshot for this date already exists");
    onConfirm({ date, label: label.trim() });
  };

  return (
    <div
      onClick={(e) => !isSaving && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          fontFamily: "Sora,sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "#F8FAFC",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#DBEAFE",
              color: "#1D4ED8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Add Update Date</div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
              Create a new column
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "none",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748B",
              marginBottom: 6,
            }}
          >
            Date <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
            }}
            disabled={isSaving}
            style={inputStyle}
          />

          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748B",
              marginBottom: 6,
              marginTop: 14,
            }}
          >
            Label (Optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Weekly Review..."
            disabled={isSaving}
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 6,
                fontSize: 11.5,
                color: "#DC2626",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: "#FAFBFC",
          }}
        >
          <button onClick={onClose} disabled={isSaving} style={btnStyle}>
            <X size={13} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              ...btnStyle,
              background: "#1D4ED8",
              color: "#fff",
              borderColor: "#1D4ED8",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Adding...
              </>
            ) : (
              <>
                <Plus size={13} /> Add Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Add Category Modal
   ═══════════════════════════════════════════════════════ */
function AddCategoryModal({
  existingCategories,
  onClose,
  onConfirm,
  isSaving = false,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter a category name");
    if (
      existingCategories.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    )
      return setError("A category with this name already exists");
    onConfirm(trimmed);
  };

  return (
    <div
      onClick={(e) => !isSaving && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          fontFamily: "Sora,sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            background: "#F8FAFC",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#EDE9FE",
              color: "#7C3AED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ClipboardList size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Add Category</div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "none",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748B",
              marginBottom: 6,
            }}
          >
            Category Name <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => !isSaving && e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Testing, Documentation..."
            disabled={isSaving}
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 6,
                fontSize: 11.5,
                color: "#DC2626",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: "#FAFBFC",
          }}
        >
          <button onClick={onClose} disabled={isSaving} style={btnStyle}>
            <X size={13} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              ...btnStyle,
              background: "#7C3AED",
              color: "#fff",
              borderColor: "#7C3AED",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Adding...
              </>
            ) : (
              <>
                <Plus size={13} /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Category Name Editor
   ═══════════════════════════════════════════════════════ */
function CategoryNameEditor({ value, onSave, onCancel }) {
  const [text, setText] = useState(value);
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text.trim() && text !== value) onSave(text.trim());
        else onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") onCancel();
      }}
      style={{ ...inputStyle, height: 26, fontSize: 12, fontWeight: 600 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   Update Cell
   ═══════════════════════════════════════════════════════ */
function UpdateCell({
  note,
  canEdit,
  isPastSnapshot,
  onSaveNote,
  onDeleteNote,
  catIdx,
  isLocked,
  showToast,
  currentUserId,
  isSaving,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localDeleting, setLocalDeleting] = useState(false);

  const hasNote = !!note;

  const handleSave = async (data) => {
    try {
      await onSaveNote({
        text: data.text,
        file: data.file,
      });
      setIsEditing(false);
    } catch (err) {
      // Keep editor open on error, error toast already shown
    }
  };

  const handleDelete = async () => {
    setLocalDeleting(true);
    try {
      await onDeleteNote();
      setConfirmDelete(false);
    } catch (err) {
      // Error toast already shown
    } finally {
      setLocalDeleting(false);
    }
  };

  const handleCellClick = () => {
    if (canEdit && !isPastSnapshot && !hasNote && !isEditing && !isSaving) {
      setIsEditing(true);
    }
  };

  return (
    <>
      <td
        onClick={handleCellClick}
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #F1F5F9",
          borderRight: "1px solid #E2E8F0",
          verticalAlign: "top",
          cursor:
            canEdit && !isPastSnapshot && !hasNote && !isEditing && !isSaving
              ? "pointer"
              : "default",
          transition: "background .12s",
          minWidth: 240,
          maxWidth: 340,
          background: isLocked
            ? "#F8FAFC"
            : isPastSnapshot
              ? catIdx % 2 === 0
                ? "#FAFBFC"
                : "#F5F7FA"
              : catIdx % 2 === 0
                ? "#fff"
                : "#FAFBFC",
          opacity: isLocked ? 0.75 : isPastSnapshot ? 0.92 : 1,
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (canEdit && !isPastSnapshot && !hasNote && !isEditing) {
            e.currentTarget.style.background = "#F0F9FF";
          }
          const actions = e.currentTarget.querySelectorAll(".note-actions");
          actions.forEach((el) => (el.style.opacity = "1"));
        }}
        onMouseLeave={(e) => {
          if (canEdit && !isPastSnapshot && !hasNote && !isEditing) {
            e.currentTarget.style.background =
              catIdx % 2 === 0 ? "#fff" : "#FAFBFC";
          }
          const actions = e.currentTarget.querySelectorAll(".note-actions");
          actions.forEach((el) => (el.style.opacity = "0"));
        }}
      >
        {isEditing ? (
          <NoteEditor
            initialText={note?.text || ""}
            initialFile={note?.file || null}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            showToast={showToast}
            isSaving={isSaving}
          />
        ) : hasNote ? (
          <>
            <NoteDisplay
              note={note}
              canEdit={canEdit}
              isPastSnapshot={isPastSnapshot}
              onEdit={() => setIsEditing(true)}
              onDelete={() => setConfirmDelete(true)}
            />
            <InlineSaving show={isSaving} />
          </>
        ) : (
          <div
            style={{
              fontSize: 11,
              color: "#CBD5E1",
              fontStyle: "italic",
              textAlign: "center",
              padding: "12px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {isLocked ? (
              <>
                <Lock size={11} /> No access
              </>
            ) : isPastSnapshot ? (
              <>
                <Lock size={11} /> No entry
              </>
            ) : isSaving ? (
              <>
                <Loader2
                  size={11}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Saving...
              </>
            ) : (
              <>
                <Plus size={12} /> Add note
              </>
            )}
          </div>
        )}
      </td>

      {confirmDelete && (
        <ConfirmDeleteModal
          title="Delete this note?"
          message="This note and its attachment will be permanently removed."
          onClose={() => !localDeleting && setConfirmDelete(false)}
          onConfirm={handleDelete}
          isDeleting={localDeleting}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProjectUpdatesView({
  projectId,
  currentUserId,
  projectOwnerId: propsProjectOwnerId, // ← NEW PROP
  showToast,
  readOnly = false,
  projectName = "",
}) {
  // ─── Data State ───
  const [updates, setUpdates] = useState(null);
  const [projectOwnerId, setProjectOwnerId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("viewer");

  // ─── Loading States ───
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // ─── Modal States ───
  const [addSnapshotOpen, setAddSnapshotOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [shareCategoryId, setShareCategoryId] = useState(null);
  const [manageSharingOpen, setManageSharingOpen] = useState(false);

  // ─── Per-Action Loading States ───
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [savingCellKeys, setSavingCellKeys] = useState(new Set());

  // ─── Refs ───
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);
  /* ─── Compute the top-level user role ─── */
  const computeCurrentUserRole = useCallback((userId, ownerId, categories) => {
    if (!userId || !ownerId) return "viewer";

    // Case-insensitive comparison
    if (userId.toLowerCase() === ownerId.toLowerCase()) {
      return "owner";
    }

    // Check if user is in ANY category's sharedWith
    const hasAnyShare = categories.some((cat) =>
      (cat.sharedWith || []).some(
        (s) => s.userId?.toLowerCase() === userId.toLowerCase(),
      ),
    );

    return hasAnyShare ? "collaborator" : "viewer";
  }, []);

  /* ─── Compute per-category user role ─── */
  const computeCategoryRole = useCallback((category, userId, ownerId) => {
    if (!userId || !ownerId) return "viewer";

    // Owner has access to everything
    if (userId.toLowerCase() === ownerId.toLowerCase()) {
      return "owner";
    }

    // Check if user is in this specific category's sharedWith
    const isShared = (category.sharedWith || []).some(
      (s) => s.userId?.toLowerCase() === userId.toLowerCase(),
    );

    return isShared ? "collaborator" : "viewer";
  }, []);
  /* ─── Normalize entries from API response ─── */
  const normalizeEntries = useCallback((entriesArray) => {
    const map = {};
    (entriesArray || []).forEach((entry) => {
      const key = `${entry.categoryId}_${entry.snapshotId}`;
      let note = null;

      if (entry.notes && entry.notes.length > 0) {
        note = entry.notes[0];
      } else if (entry.note) {
        note = entry.note;
      }

      if (note) {
        // ── Convert backend format to frontend format ──
        const normalizedNote = {
          id: note.id || note.noteId,
          categoryId: note.categoryId,
          snapshotId: note.snapshotId,
          text: note.text || note.note,
          author: note.author,
          authorName: note.authorName,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          noteFile: note.noteFile, // MinIO key
          // If noteFile exists, build file object for UI
          file: note.noteFile
            ? {
                name: extractFileNameFromKey(note.noteFile),
                key: note.noteFile,
              }
            : null,
        };
        map[key] = { note: normalizedNote };
      }
    });
    return map;
  }, []);

  // Helper: Extract original filename from MinIO key
  // e.g. "notes/2026/07/xyz-uuid-site-report.pdf" → "site-report.pdf"
  /* ─── Extract filename from MinIO key ─── */
  // Format: "uuid_filename.ext"
  // e.g. "4e9caede-f0e8-4fd0-b475-907dc38062be_assigneer.png" → "assigneer.png"
  function extractFileNameFromKey(key) {
    if (!key) return "attachment";

    // Handle case where key might have folders (e.g., "notes/2026/07/uuid_file.pdf")
    const parts = key.split("/");
    const lastPart = parts[parts.length - 1];

    // Split on first underscore to remove UUID prefix
    const underscoreIndex = lastPart.indexOf("_");
    if (underscoreIndex === -1) {
      // No underscore found — return as-is
      return lastPart;
    }

    // Return everything after the first underscore
    return lastPart.substring(underscoreIndex + 1);
  }

  /* ─── Fetch updates from API ─── */
  /* ─── Fetch updates from API ─── */
  const fetchUpdates = useCallback(
    async (isInitial = false) => {
      if (!projectId) return;

      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setLoadError(null);

      try {
        const data = await sharingApi.getProjectUpdates(projectId);

        if (controller.signal.aborted || !mountedRef.current) return;

        // ── Determine project owner ──
        // Priority: 1) API response, 2) Prop from parent, 3) Derive from first category
        let ownerId = data.projectOwnerId || propsProjectOwnerId;

        if (!ownerId && data.categories?.length > 0) {
          // Fallback: use createdBy of first category
          ownerId = data.categories[0].createdBy;
        }

        // ── Compute current user role (frontend logic) ──
        const userRole = computeCurrentUserRole(
          currentUserId,
          ownerId,
          data.categories || [],
        );

        // ── Enrich categories with per-category userRole ──
        const enrichedCategories = (data.categories || []).map((cat) => ({
          ...cat,
          userRole: computeCategoryRole(cat, currentUserId, ownerId),
        }));

        setUpdates({
          categories: enrichedCategories,
          snapshots: data.snapshots || [],
          entries: normalizeEntries(data.entries),
        });
        setProjectOwnerId(ownerId);
        setCurrentUserRole(userRole);

        console.log("🔍 Role computation:", {
          currentUserId,
          projectOwnerId: ownerId,
          currentUserRole: userRole,
          categoryRoles: enrichedCategories.map((c) => ({
            name: c.name,
            role: c.userRole,
          })),
        });
      } catch (err) {
        if (err.name === "AbortError" || !mountedRef.current) return;
        setLoadError(err);
        if (!isInitial) {
          showToast?.(
            "error",
            "Failed to refresh",
            err.userMessage || err.message,
          );
        }
      } finally {
        if (mountedRef.current && !controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      projectId,
      currentUserId,
      propsProjectOwnerId,
      showToast,
      normalizeEntries,
    ],
  );

  /* ─── Initial load ─── */
  useEffect(() => {
    fetchUpdates(true);
  }, [fetchUpdates]);

  /* ─── Optimistic sharing hook ─── */
  const applyCategorySharingUpdate = useCallback((update) => {
    setUpdates((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === update.categoryId
            ? { ...c, sharedWith: update.sharedWith }
            : c,
        ),
      };
    });
  }, []);

  // ─── Update the hook call ───
  const {
    shareCategory: apiShareCategory,
    bulkUpdate: apiBulkUpdate,
    isOperationPending: isSharingPending,
  } = useOptimisticSharing({
    projectId,
    currentUserId, // ← ADD THIS
    onUpdate: applyCategorySharingUpdate,
    showToast,
  });

  /* ─── Computed values ─── */
  const categories = updates?.categories || [];
  const snapshots = updates?.snapshots || [];
  const entries = updates?.entries || {};
  const isOwner = currentUserRole === "owner";

  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)),
    [snapshots],
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [categories],
  );

  const editableCount = useMemo(() => {
    return categories.filter((c) => {
      const role = c.userRole || "viewer";
      return role === "owner" || role === "collaborator";
    }).length;
  }, [categories]);

  const userCanAddSnapshot = isOwner || editableCount > 0;

  const totalNotes = useMemo(
    () => Object.values(entries).filter((e) => e && e.note).length,
    [entries],
  );

  const cellKey = (catId, snapId) => `${catId}_${snapId}`;
  const getCellNote = (catId, snapId) =>
    entries[cellKey(catId, snapId)]?.note || null;

  /* ═══════════════════════════════════════════════════════
     HANDLERS (API-integrated with optimistic updates)
     ═══════════════════════════════════════════════════════ */

  /* ─── Use Template ─── */
  const handleUseTemplate = async () => {
    setLoadingTemplate(true);

    const categoriesToCreate = DEFAULT_CATEGORIES.map((name, index) => ({
      id: `temp_cat_${Date.now()}${index}`,
      name,
      order: index,
      sharedWith: [],
      userRole: "owner",
      _pending: true,
      projectId: projectId,
    }));

    // Optimistic add
    setUpdates((prev) => ({
      ...prev,
      categories: [...(prev?.categories || []), ...categoriesToCreate],
    }));

    try {
      await sharingApi.loadTemplate(projectId, categoriesToCreate);

      if (!mountedRef.current) return;

      // Mark all as confirmed
      const confirmedCategories = categoriesToCreate.map((c) => ({
        ...c,
        _pending: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUserId,
      }));

      const tempIds = new Set(categoriesToCreate.map((c) => c.id));
      setUpdates((prev) => ({
        ...prev,
        categories: [
          ...(prev?.categories || []).filter((c) => !tempIds.has(c.id)),
          ...confirmedCategories,
        ],
      }));

      showToast?.(
        "success",
        "Template loaded",
        `${confirmedCategories.length} categories added.`,
      );
    } catch (err) {
      if (mountedRef.current) {
        const tempIds = new Set(categoriesToCreate.map((c) => c.id));
        setUpdates((prev) => ({
          ...prev,
          categories: (prev?.categories || []).filter(
            (c) => !tempIds.has(c.id),
          ),
        }));
      }
      showToast?.(
        "error",
        "Failed to load template",
        err.userMessage || err.message,
      );
    } finally {
      if (mountedRef.current) setLoadingTemplate(false);
    }
  };
  /* ─── Add Snapshot ─── */
  const handleAddSnapshot = async ({ date, label }) => {
    setSavingSnapshot(true);

    // Build complete snapshot object with all fields
    const snapshotToCreate = {
      id: `temp_snap_${Date.now()}`,
      date,
      label: label || "",
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
      _pending: true,
      projectId: projectId,
    };

    // Optimistic add
    setUpdates((prev) => ({
      ...prev,
      snapshots: [...prev.snapshots, snapshotToCreate],
    }));

    try {
      const response = await sharingApi.createSnapshot(
        projectId,
        snapshotToCreate,
      );

      console.log("📥 API response for createSnapshot:", response);

      if (!mountedRef.current) return;

      // Handle different response shapes defensively
      const created = response?.snapshot || response?.data || response || {};

      // Merge server response with our known data
      const finalSnapshot = {
        id: created.id || snapshotToCreate.id,
        date: created.date || date,
        label: created.label ?? label ?? "",
        createdAt: created.createdAt || snapshotToCreate.createdAt,
        createdBy: created.createdBy || currentUserId,
      };

      // Replace temp with real
      setUpdates((prev) => ({
        ...prev,
        snapshots: prev.snapshots.map((s) =>
          s.id === snapshotToCreate.id ? finalSnapshot : s,
        ),
      }));

      setAddSnapshotOpen(false);
      showToast?.("success", "Snapshot added", `${formatDate(date)} created.`);
    } catch (err) {
      // Rollback
      if (mountedRef.current) {
        setUpdates((prev) => ({
          ...prev,
          snapshots: prev.snapshots.filter((s) => s.id !== snapshotToCreate.id),
        }));
      }
      showToast?.(
        "error",
        "Failed to add update",
        err.userMessage || err.message,
      );
    } finally {
      if (mountedRef.current) setSavingSnapshot(false);
    }
  };

  /* ─── Add Category ─── */
  const handleAddCategory = async (name) => {
    setSavingCategory(true);
    const tempId = `temp_cat_${Date.now()}`;
    const tempCategory = {
      id: tempId,
      name,
      order: categories.length,
      sharedWith: [],
      userRole: "owner",
      _pending: true,
    };

    // Optimistic add
    setUpdates((prev) => ({
      ...prev,
      categories: [...prev.categories, tempCategory],
    }));

    try {
      // Backend returns true on success, so we just need to know it succeeded
      await sharingApi.createCategory(projectId, {
        id: tempId,
        name,
        order: categories.length,
        sharedWith: [],
        userRole: "owner",
        projectId: projectId,
      });

      if (!mountedRef.current) return;

      // Build the confirmed category from what we already know
      const confirmedCategory = {
        id: tempId,
        name,
        order: categories.length,
        sharedWith: [],
        userRole: "owner",
        createdAt: new Date().toISOString(),
        createdBy: currentUserId,
        _pending: false, // Remove pending state
      };

      // Replace temp with confirmed
      setUpdates((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === tempId ? confirmedCategory : c,
        ),
      }));

      setAddCategoryOpen(false);
      showToast?.("success", "Category added", `"${name}" created.`);
    } catch (err) {
      // Rollback on failure
      if (mountedRef.current) {
        setUpdates((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== tempId),
        }));
      }
      showToast?.(
        "error",
        "Failed to add category",
        err.userMessage || err.message,
      );
    } finally {
      if (mountedRef.current) setSavingCategory(false);
    }
  };

  /* ─── Rename Category ─── */
  const handleRenameCategory = async (categoryId, newName) => {
    const original = categories.find((c) => c.id === categoryId);
    if (!original) return;

    // Optimistic update
    setUpdates((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId ? { ...c, name: newName } : c,
      ),
    }));
    setEditingCategoryId(null);

    try {
      await sharingApi.renameCategory(
        projectId,
        categoryId,
        newName,
        original.order,
      );
      showToast?.("success", "Category renamed", "");
    } catch (err) {
      // Rollback
      if (mountedRef.current) {
        setUpdates((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === categoryId ? { ...c, name: original.name } : c,
          ),
        }));
      }
      showToast?.("error", "Rename failed", err.userMessage || err.message);
    }
  };

  /* ─── Delete Category ─── */
  const handleDeleteCategory = async (categoryId) => {
    setDeletingItem(true);
    try {
      await sharingApi.deleteCategory(projectId, categoryId);
      if (!mountedRef.current) return;
      setUpdates((prev) => {
        const newEntries = { ...prev.entries };
        Object.keys(newEntries).forEach((key) => {
          if (key.startsWith(`${categoryId}_`)) delete newEntries[key];
        });
        return {
          ...prev,
          categories: prev.categories.filter((c) => c.id !== categoryId),
          entries: newEntries,
        };
      });
      setConfirmDelete(null);
      showToast?.("success", "Category deleted", "");
    } catch (err) {
      showToast?.("error", "Delete failed", err.userMessage || err.message);
    } finally {
      if (mountedRef.current) setDeletingItem(false);
    }
  };

  /* ─── Delete Snapshot ─── */
  const handleDeleteSnapshot = async (snapshotId) => {
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (isSnapshotPast(snapshot?.date)) {
      showToast?.(
        "error",
        "Cannot delete",
        "Past snapshots are archived and cannot be deleted.",
      );
      setConfirmDelete(null);
      return;
    }

    setDeletingItem(true);
    try {
      await sharingApi.deleteSnapshot(projectId, snapshotId);
      if (!mountedRef.current) return;
      setUpdates((prev) => {
        const newEntries = { ...prev.entries };
        Object.keys(newEntries).forEach((key) => {
          if (key.endsWith(`_${snapshotId}`)) delete newEntries[key];
        });
        return {
          ...prev,
          snapshots: prev.snapshots.filter((s) => s.id !== snapshotId),
          entries: newEntries,
        };
      });
      setConfirmDelete(null);
      showToast?.("success", "Snapshot deleted", "");
    } catch (err) {
      showToast?.("error", "Delete failed", err.userMessage || err.message);
    } finally {
      if (mountedRef.current) setDeletingItem(false);
    }
  };

  /* ─── Save Note ─── */
  const handleSaveNote = async (catId, snapId, noteData) => {
    const key = cellKey(catId, snapId);
    const existingNote = getCellNote(catId, snapId);

    // ── Detect Update vs Create ──
    // It's an update if a saved note already exists in this cell
    const isUpdate = existingNote?.id && !existingNote._pending;

    console.log(
      "🎯 Note operation:",
      isUpdate ? "UPDATE (PUT)" : "CREATE (POST)",
      {
        existingNote,
      },
    );

    setSavingCellKeys((prev) => new Set([...prev, key]));

    // ── Detect file state ──
    const isNewFileUpload = !!noteData.file?.data; // Has raw base64 data (fresh upload)
    const hasExistingFile = !!existingNote?.noteFile;

    // ── Extract Base64 (only for NEW file uploads) ──
    let attachmentBase64 = null;
    let attachmentName = null;

    if (isNewFileUpload) {
      // Strip data URL prefix
      attachmentBase64 = noteData.file.data.includes(",")
        ? noteData.file.data.split(",")[1]
        : noteData.file.data;
      attachmentName = noteData.file.name;
    }

    // ── Build optimistic note for UI ──
    const optimisticNote = {
      id: existingNote?.id || `temp_note_${Date.now()}`,
      categoryId: catId,
      snapshotId: snapId,
      text: noteData.text,
      file: isNewFileUpload
        ? noteData.file // New upload
        : noteData.file
          ? existingNote?.file // Kept existing
          : null, // Removed
      noteFile: isNewFileUpload
        ? null // Will be replaced by backend
        : noteData.file
          ? existingNote?.noteFile
          : null,
      author: existingNote?.author || currentUserId,
      authorName: existingNote?.authorName || undefined,
      createdAt: existingNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _pending: true,
    };

    // ── Build API payload ──
    const apiPayload = {
      id: optimisticNote.id,
      noteId: optimisticNote.id,
      projectId,
      categoryId: catId,
      snapshotId: snapId,
      text: noteData.text,
      note: noteData.text, // Backend uses "note" field
      notedDate:
        existingNote?.notedDate || new Date().toISOString().split("T")[0],
      author: optimisticNote.author,
      authorName: optimisticNote.authorName || null,
    };

    // Only include attachment fields for NEW file uploads
    if (isNewFileUpload) {
      apiPayload.attachmentBase64 = attachmentBase64;
      apiPayload.attachmentName = attachmentName;
    }

    // ── Optimistic UI update ──
    setUpdates((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [key]: { note: optimisticNote },
      },
    }));

    try {
      let response;

      if (isUpdate) {
        // ── UPDATE (PUT) ──
        console.log("📤 PUT payload:", apiPayload);
        response = await sharingApi.updateNote(
          projectId,
          existingNote.id,
          apiPayload,
        );
      } else {
        // ── CREATE (POST) ──
        console.log("📤 POST payload:", apiPayload);
        response = await sharingApi.createNote(projectId, apiPayload);
      }

      console.log(
        `📥 Response for ${isUpdate ? "UPDATE" : "CREATE"}:`,
        response,
      );

      if (!mountedRef.current) return response;

      // ── Handle response ──
      const isSuccess =
        response === true ||
        response?.success === true ||
        (typeof response === "object" && response !== null);

      if (!isSuccess) {
        throw new ApiError("Note save failed on server", 500, "SAVE_FAILED");
      }

      // ── Build final note (backend returns boolean, so we use optimistic + refetch) ──
      let finalNote = { ...optimisticNote, _pending: false };

      if (
        typeof response === "object" &&
        response !== null &&
        !("success" in response)
      ) {
        // Backend returned actual note data
        const savedNote = response?.note || response?.data || response;
        finalNote = {
          ...optimisticNote,
          _pending: false,
          id: savedNote.id || savedNote.noteId || optimisticNote.id,
          noteFile: savedNote.noteFile || optimisticNote.noteFile,
          file: savedNote.noteFile
            ? {
                name:
                  attachmentName || extractFileNameFromKey(savedNote.noteFile),
                key: savedNote.noteFile,
              }
            : optimisticNote.file,
          updatedAt: savedNote.updatedAt || optimisticNote.updatedAt,
        };
      } else if (isNewFileUpload) {
        // Backend returned boolean, but we uploaded a file — refetch to get new MinIO key
        console.log("📥 Refetching to get new MinIO key...");
        setTimeout(() => fetchUpdates(false), 300);
      }

      setUpdates((prev) => ({
        ...prev,
        entries: {
          ...prev.entries,
          [key]: { note: finalNote },
        },
      }));

      showToast?.("success", isUpdate ? "Note updated" : "Note created", "");
      return finalNote;
    } catch (err) {
      // ── Rollback ──
      if (mountedRef.current) {
        setUpdates((prev) => {
          const newEntries = { ...prev.entries };
          if (existingNote) {
            newEntries[key] = { note: existingNote };
          } else {
            delete newEntries[key];
          }
          return { ...prev, entries: newEntries };
        });
      }
      showToast?.(
        "error",
        "Failed to save note",
        err.userMessage || err.message,
      );
      throw err;
    } finally {
      if (mountedRef.current) {
        setSavingCellKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  };

  /* ─── Delete Note ─── */
  const handleDeleteNote = async (catId, snapId) => {
    const key = cellKey(catId, snapId);
    const existingNote = getCellNote(catId, snapId);
    if (!existingNote) return;

    setSavingCellKeys((prev) => new Set([...prev, key]));

    // Optimistic remove
    setUpdates((prev) => {
      const newEntries = { ...prev.entries };
      delete newEntries[key];
      return { ...prev, entries: newEntries };
    });

    try {
      // If it's a temp note (never saved to server), just remove locally
      if (!String(existingNote.id).startsWith("temp_")) {
        await sharingApi.deleteNote(projectId, existingNote.id);
      }
      showToast?.("success", "Note deleted", "");
    } catch (err) {
      // Rollback
      if (mountedRef.current) {
        setUpdates((prev) => ({
          ...prev,
          entries: {
            ...prev.entries,
            [key]: { note: existingNote },
          },
        }));
      }
      showToast?.("error", "Delete failed", err.userMessage || err.message);
      throw err;
    } finally {
      if (mountedRef.current) {
        setSavingCellKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  };

  // ─── Update handleShareCategory ───
  const handleShareCategory = async (categoryId, newSharedWith) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const userIds = newSharedWith.map((u) => u.userId);

    try {
      await apiShareCategory(
        categoryId,
        userIds,
        category.sharedWith,
        category.name, // ← Pass category name for full payload
      );
      setShareCategoryId(null);
    } catch (err) {
      // Error already shown by hook
    }
  };
  // ─── Update handleBulkShareUpdate ───
  const handleBulkShareUpdate = async (sharingResult) => {
    try {
      await apiBulkUpdate(sharingResult, categories);
      setManageSharingOpen(false);
    } catch (err) {
      // Error already shown by hook
    }
  };

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  // Initial loading
  if (isLoading && !updates) {
    return <LoadingSkeleton />;
  }

  // Load error (no cached data)
  if (loadError && !updates) {
    return <ErrorState error={loadError} onRetry={() => fetchUpdates(true)} />;
  }

  if (!updates) return null;

  const isEmpty = categories.length === 0 && snapshots.length === 0;

  /* ─── Empty State ─── */
  if (isEmpty) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px dashed #CBD5E1",
          borderRadius: 12,
          padding: "60px 20px",
          textAlign: "center",
          fontFamily: "Sora,sans-serif",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: isOwner ? "#FEF3C7" : "#F1F5F9",
            color: isOwner ? "#B45309" : "#94A3B8",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {isOwner ? <ClipboardList size={30} /> : <Lock size={30} />}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
          {isOwner ? "Track Project Progress Updates" : "No Updates Available"}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "#64748B",
            maxWidth: 460,
            margin: "0 auto 20px",
          }}
        >
          {isOwner
            ? "Record status snapshots for key project areas. Attach files and share with team members."
            : "The project owner hasn't added any update categories yet."}
        </div>

        {isOwner && !readOnly && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={handleUseTemplate}
              disabled={loadingTemplate}
              style={{
                ...btnStyle,
                background: "#1D4ED8",
                color: "#fff",
                borderColor: "#1D4ED8",
                height: 38,
                opacity: loadingTemplate ? 0.7 : 1,
                cursor: loadingTemplate ? "not-allowed" : "pointer",
              }}
            >
              {loadingTemplate ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Loading...
                </>
              ) : (
                <>
                  <ClipboardList size={14} /> Use Default Template
                </>
              )}
            </button>
            <button
              onClick={() => setAddCategoryOpen(true)}
              disabled={loadingTemplate}
              style={{
                ...btnStyle,
                height: 38,
                opacity: loadingTemplate ? 0.6 : 1,
              }}
            >
              <Plus size={14} /> Start Blank
            </button>
          </div>
        )}

        {addCategoryOpen && (
          <AddCategoryModal
            existingCategories={categories}
            onClose={() => setAddCategoryOpen(false)}
            onConfirm={handleAddCategory}
            isSaving={savingCategory}
          />
        )}
      </div>
    );
  }

  /* ─── Main Matrix View ─── */
  return (
    <div style={{ fontFamily: "Sora,sans-serif", position: "relative" }}>
      {/* Refresh indicator */}
      {isRefreshing && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: 0,
            zIndex: 10,
            padding: "4px 10px",
            background: "#F0F9FF",
            border: "1px solid #BAE6FD",
            borderRadius: 999,
            fontSize: 10.5,
            color: "#0369A1",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 5,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
          Refreshing...
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "12px 18px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontWeight: 700,
            fontSize: 13.5,
          }}
        >
          <ClipboardList size={16} color="#B45309" />
          Progress Updates
        </div>
        <div style={{ fontSize: 11.5, color: "#64748B" }}>
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"} ·{" "}
          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} ·{" "}
          {totalNotes} note{totalNotes !== 1 ? "s" : ""}
        </div>

        {!readOnly && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => fetchUpdates(false)}
              disabled={isRefreshing}
              title="Refresh"
              style={{
                ...btnStyle,
                height: 32,
                opacity: isRefreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                }}
              />
              Refresh
            </button>

            {isOwner && (
              <>
                <button
                  onClick={() => setAddCategoryOpen(true)}
                  style={{
                    ...btnStyle,
                    height: 32,
                    background: "#EDE9FE",
                    color: "#7C3AED",
                    borderColor: "#DDD6FE",
                  }}
                >
                  <Plus size={13} /> Add Category
                </button>
                {categories.length > 0 && (
                  <button
                    onClick={() => setManageSharingOpen(true)}
                    style={{
                      ...btnStyle,
                      height: 32,
                      background: "#F0FDF4",
                      color: "#15803D",
                      borderColor: "#86EFAC",
                    }}
                  >
                    <Users size={13} /> Manage Sharing
                  </button>
                )}
              </>
            )}
            {userCanAddSnapshot && (
              <button
                onClick={() => setAddSnapshotOpen(true)}
                style={{
                  ...btnStyle,
                  height: 32,
                  background: "#1D4ED8",
                  color: "#fff",
                  borderColor: "#1D4ED8",
                }}
              >
                <Calendar size={13} /> Add Update
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role Banner */}
      {!readOnly && !isOwner && (
        <div
          style={{
            padding: "10px 14px",
            background: editableCount > 0 ? "#F0F9FF" : "#FFFBEB",
            border: `1px solid ${editableCount > 0 ? "#BAE6FD" : "#FCD34D"}`,
            borderRadius: 8,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: editableCount > 0 ? "#0369A1" : "#92400E",
          }}
        >
          {editableCount > 0 ? (
            <>
              <Users size={14} />
              <span>
                You have edit access to <strong>{editableCount}</strong> of{" "}
                <strong>{categories.length}</strong> categor
                {categories.length !== 1 ? "ies" : "y"}.
              </span>
            </>
          ) : (
            <>
              <Lock size={14} />
              <span>
                <strong>View-only access.</strong> Contact{" "}
                {findUserById(projectOwnerId)?.userName || projectOwnerId} for
                access.
              </span>
            </>
          )}
        </div>
      )}

      {/* Matrix */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 600,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    width: 240,
                    minWidth: 240,
                    padding: "12px 16px",
                    background: "#1E40AF",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11.5,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                  }}
                >
                  Update
                </th>
                {sortedSnapshots.map((snap) => {
                  const isPast = isSnapshotPast(snap.date);
                  const canDelete = isOwner && !isPast && !snap._pending;
                  return (
                    <th
                      key={snap.id}
                      style={{
                        minWidth: 240,
                        padding: "10px 14px",
                        background: isPast ? "#334155" : "#1E40AF",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                        textAlign: "center",
                        borderRight: "1px solid rgba(255,255,255,0.15)",
                        opacity: snap._pending ? 0.7 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        {snap._pending ? (
                          <Loader2
                            size={11}
                            style={{
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        ) : isPast ? (
                          <Lock size={11} style={{ opacity: 0.8 }} />
                        ) : null}
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 12,
                          }}
                        >
                          {formatDate(snap.date)}
                        </span>
                        {isOwner &&
                          (isPast ? (
                            <span
                              title="Past snapshots cannot be deleted"
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                background: "rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.6)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "not-allowed",
                              }}
                            >
                              <Lock size={10} />
                            </span>
                          ) : canDelete ? (
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  type: "snapshot",
                                  id: snap.id,
                                  name: formatDate(snap.date),
                                })
                              }
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.3)",
                                background: "rgba(255,255,255,0.15)",
                                cursor: "pointer",
                                color: "#fff",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={11} />
                            </button>
                          ) : null)}
                      </div>
                      {snap.label && (
                        <div
                          style={{
                            fontSize: 10,
                            opacity: 0.8,
                            marginTop: 2,
                            fontWeight: 400,
                          }}
                        >
                          {snap.label}
                        </div>
                      )}
                      {isPast && (
                        <div
                          style={{
                            fontSize: 9.5,
                            opacity: 0.75,
                            marginTop: 2,
                            fontStyle: "italic",
                          }}
                        >
                          Archived
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((cat, catIdx) => {
                const role = cat.userRole || "viewer";
                const canEdit =
                  (role === "owner" || role === "collaborator") && !readOnly;
                const canManage = role === "owner" && !readOnly;
                const isLocked = !canEdit;
                const sharedCount = (cat.sharedWith || []).length;

                return (
                  <tr key={cat.id} style={{ opacity: cat._pending ? 0.7 : 1 }}>
                    <td
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #F1F5F9",
                        borderRight: "1px solid #E2E8F0",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isLocked ? "#94A3B8" : "#0F172A",
                        position: "sticky",
                        left: 0,
                        background: isLocked
                          ? "#F8FAFC"
                          : catIdx % 2 === 0
                            ? "#fff"
                            : "#FAFBFC",
                        zIndex: 1,
                        verticalAlign: "top",
                        opacity: isLocked ? 0.75 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {cat._pending ? (
                          <Loader2
                            size={12}
                            style={{
                              animation: "spin 1s linear infinite",
                              color: "#1D4ED8",
                            }}
                          />
                        ) : isLocked ? (
                          <Lock size={12} color="#94A3B8" />
                        ) : null}

                        {editingCategoryId === cat.id ? (
                          <CategoryNameEditor
                            value={cat.name}
                            onSave={(newName) =>
                              handleRenameCategory(cat.id, newName)
                            }
                            onCancel={() => setEditingCategoryId(null)}
                          />
                        ) : (
                          <>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              {cat.name}
                            </span>

                            {sharedCount > 0 && (
                              <span
                                title={`Shared with ${sharedCount} user${sharedCount !== 1 ? "s" : ""}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  padding: "2px 6px",
                                  background:
                                    role === "collaborator"
                                      ? "#DBEAFE"
                                      : "#DCFCE7",
                                  color:
                                    role === "collaborator"
                                      ? "#1D4ED8"
                                      : "#15803D",
                                  border: `1px solid ${
                                    role === "collaborator"
                                      ? "#93C5FD"
                                      : "#86EFAC"
                                  }`,
                                  borderRadius: 999,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                }}
                              >
                                <Users size={9} />
                                {sharedCount}
                              </span>
                            )}

                            {canManage && !cat._pending && (
                              <div style={{ display: "flex", gap: 3 }}>
                                <button
                                  onClick={() => setShareCategoryId(cat.id)}
                                  title="Share"
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 4,
                                    border: "1px solid #86EFAC",
                                    background: "#F0FDF4",
                                    cursor: "pointer",
                                    color: "#15803D",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Share2 size={10} />
                                </button>
                                <button
                                  onClick={() => setEditingCategoryId(cat.id)}
                                  title="Rename"
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 4,
                                    border: "1px solid #E2E8F0",
                                    background: "#fff",
                                    cursor: "pointer",
                                    color: "#64748B",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Edit size={10} />
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmDelete({
                                      type: "category",
                                      id: cat.id,
                                      name: cat.name,
                                    })
                                  }
                                  title="Delete"
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 4,
                                    border: "1px solid #FCA5A5",
                                    background: "#FEF2F2",
                                    cursor: "pointer",
                                    color: "#EF4444",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {sortedSnapshots.map((snap) => {
                      const key = cellKey(cat.id, snap.id);
                      return (
                        <UpdateCell
                          key={snap.id}
                          note={getCellNote(cat.id, snap.id)}
                          canEdit={canEdit}
                          isLocked={isLocked}
                          isPastSnapshot={isSnapshotPast(snap.date)}
                          catIdx={catIdx}
                          currentUserId={currentUserId}
                          showToast={showToast}
                          isSaving={savingCellKeys.has(key)}
                          onSaveNote={(note) =>
                            handleSaveNote(cat.id, snap.id, note)
                          }
                          onDeleteNote={() => handleDeleteNote(cat.id, snap.id)}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {addSnapshotOpen && (
        <AddSnapshotModal
          existingSnapshots={snapshots}
          onClose={() => setAddSnapshotOpen(false)}
          onConfirm={handleAddSnapshot}
          isSaving={savingSnapshot}
        />
      )}

      {addCategoryOpen && (
        <AddCategoryModal
          existingCategories={categories}
          onClose={() => setAddCategoryOpen(false)}
          onConfirm={handleAddCategory}
          isSaving={savingCategory}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          title={
            confirmDelete.type === "category"
              ? `Delete "${confirmDelete.name}" category?`
              : `Delete snapshot "${confirmDelete.name}"?`
          }
          message={
            confirmDelete.type === "category"
              ? "This category and all its notes will be permanently removed."
              : "This snapshot and all its notes will be permanently removed."
          }
          onClose={() => !deletingItem && setConfirmDelete(null)}
          onConfirm={() =>
            confirmDelete.type === "category"
              ? handleDeleteCategory(confirmDelete.id)
              : handleDeleteSnapshot(confirmDelete.id)
          }
          isDeleting={deletingItem}
        />
      )}

      {shareCategoryId && (
        <ShareModal
          category={categories.find((c) => c.id === shareCategoryId)}
          currentUserId={currentUserId}
          isSaving={isSharingPending}
          onClose={() => !isSharingPending && setShareCategoryId(null)}
          onSave={(newSharedWith) =>
            handleShareCategory(shareCategoryId, newSharedWith)
          }
        />
      )}

      {manageSharingOpen && (
        <ManageSharingModal
          categories={sortedCategories}
          currentUserId={currentUserId}
          isSaving={isSharingPending}
          onClose={() => !isSharingPending && setManageSharingOpen(false)}
          onSave={handleBulkShareUpdate}
        />
      )}
    </div>
  );
}
