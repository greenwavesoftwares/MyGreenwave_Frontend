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
import { useTheme } from "./useTheme";

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

/* ═══════════════════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════════════════ */
function LoadingSkeleton() {
  const { t } = useTheme();
  return (
    <div
      style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
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
          style={{ animation: "spin 1s linear infinite", color: t.primary }}
        />
        <div style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>
          Loading updates...
        </div>
        <div style={{ fontSize: 11, color: t.textFaint }}>
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
  const { t } = useTheme();
  const isNetwork = error?.isNetworkError;
  const isPermission = error?.isPermissionError;
  const isNotFound = error?.isNotFound;

  let Icon = AlertCircle;
  let title = "Failed to load updates";
  let bgColor = t.dangerBgSubtle;
  let borderColor = t.dangerBorder;
  let iconColor = t.danger;
  let iconBg = t.dangerBg;

  if (isNetwork) {
    Icon = WifiOff;
    title = "Connection Problem";
  } else if (isPermission) {
    Icon = Lock;
    title = "Access Denied";
    bgColor = t.warningBgSubtle;
    borderColor = t.warningBorder;
    iconColor = t.warning;
    iconBg = t.warningBg;
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
            color: t.textPrimary,
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: t.textSecondary,
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
              background: t.bgMuted,
              borderRadius: 4,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: t.textMuted,
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
              height: 32,
              padding: "0 14px",
              borderRadius: 7,
              background: t.danger,
              color: t.textInverse,
              border: `1px solid ${t.danger}`,
              fontFamily: "Sora,sans-serif",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
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
  const { t } = useTheme();
  if (!show) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        background: t.infoBg,
        color: t.info,
        border: `1px solid ${t.infoBorder}`,
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
  const { t } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!file) return null;
  const FileIcon = getFileIcon(file.name);
  const isSmall = size === "sm";

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (file.key) {
      setIsDownloading(true);
      try {
        await sharingApi.downloadAndSaveFile(file.key, file.name);
      } catch (err) {
        console.error("Download failed:", err);
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
        background: t.infoBg,
        border: `1px solid ${t.infoBorder}`,
        borderRadius: 6,
        fontSize: isSmall ? 10.5 : 11.5,
        color: t.info,
        maxWidth: "100%",
        opacity: isDownloading ? 0.6 : 1,
      }}
    >
      {isDownloading ? (
        <Loader2
          size={isSmall ? 11 : 13}
          style={{ flexShrink: 0, animation: "spin 1s linear infinite" }}
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
        <span style={{ color: t.textMuted, fontSize: 10 }}>
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
            background: t.dangerBgSubtle,
            color: t.danger,
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
  const { t } = useTheme();
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

  const btnStyle = {
    height: 28,
    padding: "0 10px",
    borderRadius: 6,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

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
                color: t.info,
                borderColor: t.infoBorder,
                background: t.infoBg,
                opacity: isDisabled ? 0.6 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? (
                <>
                  <Loader2
                    size={11}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
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
          width: "100%",
          minHeight: 80,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 6,
          padding: "8px 10px",
          fontFamily: "Sora,sans-serif",
          fontSize: 12,
          lineHeight: 1.5,
          outline: "none",
          boxSizing: "border-box",
          resize: "vertical",
          background: isDisabled ? t.bgInputDisabled : t.bgInput,
          color: t.textPrimary,
        }}
      />

      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          disabled={isDisabled}
          style={{
            ...btnStyle,
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
            background: text.trim() && !isDisabled ? t.primary : t.bgMuted,
            color: text.trim() && !isDisabled ? t.textInverse : t.textFaint,
            borderColor: text.trim() && !isDisabled ? t.primary : t.border,
            cursor: text.trim() && !isDisabled ? "pointer" : "not-allowed",
          }}
        >
          {isSaving ? (
            <>
              <Loader2
                size={11}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
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
  const { t } = useTheme();
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
              border: `1px solid ${copied ? t.successBorder : t.border}`,
              background: copied ? t.successBg : t.bgCard,
              cursor: "pointer",
              color: copied ? t.success : t.textMuted,
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
                  border: `1px solid ${t.border}`,
                  background: t.bgCard,
                  cursor: "pointer",
                  color: t.textMuted,
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
                  border: `1px solid ${t.dangerBorder}`,
                  background: t.dangerBgSubtle,
                  cursor: "pointer",
                  color: t.danger,
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
          color: t.textPrimary,
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
            color: t.textFaint,
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
              background: t.primaryBg,
              color: t.primary,
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
            background: t.bgMuted,
            color: t.textMuted,
            border: `1px solid ${t.borderStrong}`,
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
  const { t } = useTheme();

  const btnStyle = {
    height: 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <div
      onClick={(e) => !isDeleting && e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 12,
          padding: 20,
          width: "100%",
          maxWidth: 400,
          fontFamily: "Sora,sans-serif",
          color: t.textPrimary,
          boxShadow: t.shadowXl,
        }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: t.dangerBgSubtle,
              color: t.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {title}
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 4 }}>
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
              background: t.danger,
              color: t.textInverse,
              borderColor: t.danger,
              opacity: isDeleting ? 0.7 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            {isDeleting ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
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
  const { t } = useTheme();
  const [date, setDate] = useState(todayISO());
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%",
    height: 34,
    border: `1px solid ${t.borderStrong}`,
    borderRadius: 6,
    background: t.bgInput,
    color: t.textPrimary,
    padding: "0 10px",
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    boxSizing: "border-box",
    outline: "none",
  };

  const btnStyle = {
    height: 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

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
        background: t.bgOverlay,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          fontFamily: "Sora,sans-serif",
          color: t.textPrimary,
          boxShadow: t.shadowXl,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: t.primaryBg,
              color: t.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Add Update Date
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
              Create a new column
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "none",
              border: "none",
              color: t.textFaint,
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
              color: t.textMuted,
              marginBottom: 6,
            }}
          >
            Date <span style={{ color: t.danger }}>*</span>
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
              color: t.textMuted,
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
                background: t.dangerBgSubtle,
                border: `1px solid ${t.dangerBorder}`,
                borderRadius: 6,
                fontSize: 11.5,
                color: t.danger,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
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
              background: t.primary,
              color: t.textInverse,
              borderColor: t.primary,
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
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
  const { t } = useTheme();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const inputStyle = {
    width: "100%",
    height: 34,
    border: `1px solid ${t.borderStrong}`,
    borderRadius: 6,
    background: t.bgInput,
    color: t.textPrimary,
    padding: "0 10px",
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    boxSizing: "border-box",
    outline: "none",
  };

  const btnStyle = {
    height: 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

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
        background: t.bgOverlay,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: t.bgCard,
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          fontFamily: "Sora,sans-serif",
          color: t.textPrimary,
          boxShadow: t.shadowXl,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: t.violetBg,
              color: t.violet,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ClipboardList size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Add Category
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "none",
              border: "none",
              color: t.textFaint,
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
              color: t.textMuted,
              marginBottom: 6,
            }}
          >
            Category Name <span style={{ color: t.danger }}>*</span>
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
                background: t.dangerBgSubtle,
                border: `1px solid ${t.dangerBorder}`,
                borderRadius: 6,
                fontSize: 11.5,
                color: t.danger,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
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
              background: t.violet,
              color: t.textInverse,
              borderColor: t.violet,
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
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
  const { t } = useTheme();
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
      style={{
        width: "100%",
        height: 26,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 6,
        background: t.bgInput,
        color: t.textPrimary,
        padding: "0 10px",
        fontFamily: "Sora,sans-serif",
        fontSize: 12,
        fontWeight: 600,
        boxSizing: "border-box",
        outline: "none",
      }}
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
  const { t } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localDeleting, setLocalDeleting] = useState(false);

  const hasNote = !!note;

  const handleSave = async (data) => {
    try {
      await onSaveNote({ text: data.text, file: data.file });
      setIsEditing(false);
    } catch (err) {}
  };

  const handleDelete = async () => {
    setLocalDeleting(true);
    try {
      await onDeleteNote();
      setConfirmDelete(false);
    } catch (err) {
    } finally {
      setLocalDeleting(false);
    }
  };

  const handleCellClick = () => {
    if (canEdit && !isPastSnapshot && !hasNote && !isEditing && !isSaving) {
      setIsEditing(true);
    }
  };

  // Alternating row backgrounds
  const evenBg = t.bgCard;
  const oddBg = t.bgSubtle;
  const lockedBg = t.bgSubtle;
  const hoverBg = t.primaryBgSubtle;

  return (
    <>
      <td
        onClick={handleCellClick}
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${t.borderSubtle}`,
          borderRight: `1px solid ${t.border}`,
          verticalAlign: "top",
          cursor:
            canEdit && !isPastSnapshot && !hasNote && !isEditing && !isSaving
              ? "pointer"
              : "default",
          transition: "background .12s",
          minWidth: 240,
          maxWidth: 340,
          background: isLocked ? lockedBg : catIdx % 2 === 0 ? evenBg : oddBg,
          opacity: isLocked ? 0.75 : isPastSnapshot ? 0.92 : 1,
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (canEdit && !isPastSnapshot && !hasNote && !isEditing) {
            e.currentTarget.style.background = hoverBg;
          }
          const actions = e.currentTarget.querySelectorAll(".note-actions");
          actions.forEach((el) => (el.style.opacity = "1"));
        }}
        onMouseLeave={(e) => {
          if (canEdit && !isPastSnapshot && !hasNote && !isEditing) {
            e.currentTarget.style.background =
              catIdx % 2 === 0 ? evenBg : oddBg;
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
              color: t.textDisabled,
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
                />{" "}
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
  projectOwnerId: propsProjectOwnerId,
  showToast,
  readOnly = false,
  projectName = "",
}) {
  const { t } = useTheme();

  // Data state
  const [updates, setUpdates] = useState(null);
  const [projectOwnerId, setProjectOwnerId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("viewer");

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Modal states
  const [addSnapshotOpen, setAddSnapshotOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [shareCategoryId, setShareCategoryId] = useState(null);
  const [manageSharingOpen, setManageSharingOpen] = useState(false);

  // Per-action loading
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [savingCellKeys, setSavingCellKeys] = useState(new Set());

  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  // Themed button style
  const btnStyle = {
    height: 32,
    padding: "0 14px",
    borderRadius: 7,
    border: `1px solid ${t.borderStrong}`,
    background: t.bgCard,
    color: t.textSecondary,
    fontFamily: "Sora,sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const computeCurrentUserRole = useCallback((userId, ownerId, categories) => {
    if (!userId || !ownerId) return "viewer";
    if (userId.toLowerCase() === ownerId.toLowerCase()) return "owner";
    const hasAnyShare = categories.some((cat) =>
      (cat.sharedWith || []).some(
        (s) => s.userId?.toLowerCase() === userId.toLowerCase(),
      ),
    );
    return hasAnyShare ? "collaborator" : "viewer";
  }, []);

  const computeCategoryRole = useCallback((category, userId, ownerId) => {
    if (!userId || !ownerId) return "viewer";
    if (userId.toLowerCase() === ownerId.toLowerCase()) return "owner";
    const isShared = (category.sharedWith || []).some(
      (s) => s.userId?.toLowerCase() === userId.toLowerCase(),
    );
    return isShared ? "collaborator" : "viewer";
  }, []);

  function extractFileNameFromKey(key) {
    if (!key) return "attachment";
    const parts = key.split("/");
    const lastPart = parts[parts.length - 1];
    const underscoreIndex = lastPart.indexOf("_");
    if (underscoreIndex === -1) return lastPart;
    return lastPart.substring(underscoreIndex + 1);
  }

  const normalizeEntries = useCallback((entriesArray) => {
    const map = {};
    (entriesArray || []).forEach((entry) => {
      const key = `${entry.categoryId}_${entry.snapshotId}`;
      let note = null;
      if (entry.notes && entry.notes.length > 0) note = entry.notes[0];
      else if (entry.note) note = entry.note;

      if (note) {
        const normalizedNote = {
          id: note.id || note.noteId,
          categoryId: note.categoryId,
          snapshotId: note.snapshotId,
          text: note.text || note.note,
          author: note.author,
          authorName: note.authorName,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          noteFile: note.noteFile,
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

  const fetchUpdates = useCallback(
    async (isInitial = false) => {
      if (!projectId) return;
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (isInitial) setIsLoading(true);
      else setIsRefreshing(true);
      setLoadError(null);

      try {
        const data = await sharingApi.getProjectUpdates(projectId);
        if (controller.signal.aborted || !mountedRef.current) return;

        let ownerId = data.projectOwnerId || propsProjectOwnerId;
        if (!ownerId && data.categories?.length > 0) {
          ownerId = data.categories[0].createdBy;
        }

        const userRole = computeCurrentUserRole(
          currentUserId,
          ownerId,
          data.categories || [],
        );
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
      computeCurrentUserRole,
      computeCategoryRole,
    ],
  );

  useEffect(() => {
    fetchUpdates(true);
  }, [fetchUpdates]);

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

  const {
    shareCategory: apiShareCategory,
    bulkUpdate: apiBulkUpdate,
    isOperationPending: isSharingPending,
  } = useOptimisticSharing({
    projectId,
    currentUserId,
    onUpdate: applyCategorySharingUpdate,
    showToast,
  });

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

  // ── All handlers (unchanged logic) ──
  const handleUseTemplate = async () => {
    setLoadingTemplate(true);
    const categoriesToCreate = DEFAULT_CATEGORIES.map((name, index) => ({
      id: `temp_cat_${Date.now()}${index}`,
      name,
      order: index,
      sharedWith: [],
      userRole: "owner",
      _pending: true,
      projectId,
    }));
    setUpdates((prev) => ({
      ...prev,
      categories: [...(prev?.categories || []), ...categoriesToCreate],
    }));
    try {
      await sharingApi.loadTemplate(projectId, categoriesToCreate);
      if (!mountedRef.current) return;
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

  const handleAddSnapshot = async ({ date, label }) => {
    setSavingSnapshot(true);
    const snapshotToCreate = {
      id: `temp_snap_${Date.now()}`,
      date,
      label: label || "",
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
      _pending: true,
      projectId,
    };
    setUpdates((prev) => ({
      ...prev,
      snapshots: [...prev.snapshots, snapshotToCreate],
    }));
    try {
      const response = await sharingApi.createSnapshot(
        projectId,
        snapshotToCreate,
      );
      if (!mountedRef.current) return;
      const created = response?.snapshot || response?.data || response || {};
      const finalSnapshot = {
        id: created.id || snapshotToCreate.id,
        date: created.date || date,
        label: created.label ?? label ?? "",
        createdAt: created.createdAt || snapshotToCreate.createdAt,
        createdBy: created.createdBy || currentUserId,
      };
      setUpdates((prev) => ({
        ...prev,
        snapshots: prev.snapshots.map((s) =>
          s.id === snapshotToCreate.id ? finalSnapshot : s,
        ),
      }));
      setAddSnapshotOpen(false);
      showToast?.("success", "Snapshot added", `${formatDate(date)} created.`);
    } catch (err) {
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
    setUpdates((prev) => ({
      ...prev,
      categories: [...prev.categories, tempCategory],
    }));
    try {
      await sharingApi.createCategory(projectId, {
        id: tempId,
        name,
        order: categories.length,
        sharedWith: [],
        userRole: "owner",
        projectId,
      });
      if (!mountedRef.current) return;
      const confirmedCategory = {
        id: tempId,
        name,
        order: categories.length,
        sharedWith: [],
        userRole: "owner",
        createdAt: new Date().toISOString(),
        createdBy: currentUserId,
        _pending: false,
      };
      setUpdates((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === tempId ? confirmedCategory : c,
        ),
      }));
      setAddCategoryOpen(false);
      showToast?.("success", "Category added", `"${name}" created.`);
    } catch (err) {
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

  const handleRenameCategory = async (categoryId, newName) => {
    const original = categories.find((c) => c.id === categoryId);
    if (!original) return;
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

  const handleSaveNote = async (catId, snapId, noteData) => {
    const key = cellKey(catId, snapId);
    const existingNote = getCellNote(catId, snapId);
    const isUpdate = existingNote?.id && !existingNote._pending;
    setSavingCellKeys((prev) => new Set([...prev, key]));

    const isNewFileUpload = !!noteData.file?.data;
    let attachmentBase64 = null;
    let attachmentName = null;
    if (isNewFileUpload) {
      attachmentBase64 = noteData.file.data.includes(",")
        ? noteData.file.data.split(",")[1]
        : noteData.file.data;
      attachmentName = noteData.file.name;
    }

    const optimisticNote = {
      id: existingNote?.id || `temp_note_${Date.now()}`,
      categoryId: catId,
      snapshotId: snapId,
      text: noteData.text,
      file: isNewFileUpload
        ? noteData.file
        : noteData.file
          ? existingNote?.file
          : null,
      noteFile: isNewFileUpload
        ? null
        : noteData.file
          ? existingNote?.noteFile
          : null,
      author: existingNote?.author || currentUserId,
      authorName: existingNote?.authorName || undefined,
      createdAt: existingNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _pending: true,
    };

    const apiPayload = {
      id: optimisticNote.id,
      noteId: optimisticNote.id,
      projectId,
      categoryId: catId,
      snapshotId: snapId,
      text: noteData.text,
      note: noteData.text,
      notedDate:
        existingNote?.notedDate || new Date().toISOString().split("T")[0],
      author: optimisticNote.author,
      authorName: optimisticNote.authorName || null,
    };
    if (isNewFileUpload) {
      apiPayload.attachmentBase64 = attachmentBase64;
      apiPayload.attachmentName = attachmentName;
    }

    setUpdates((prev) => ({
      ...prev,
      entries: { ...prev.entries, [key]: { note: optimisticNote } },
    }));

    try {
      let response;
      if (isUpdate)
        response = await sharingApi.updateNote(
          projectId,
          existingNote.id,
          apiPayload,
        );
      else response = await sharingApi.createNote(projectId, apiPayload);
      if (!mountedRef.current) return response;

      const isSuccess =
        response === true ||
        response?.success === true ||
        (typeof response === "object" && response !== null);
      if (!isSuccess) throw new Error("Note save failed on server");

      let finalNote = { ...optimisticNote, _pending: false };
      if (
        typeof response === "object" &&
        response !== null &&
        !("success" in response)
      ) {
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
        setTimeout(() => fetchUpdates(false), 300);
      }

      setUpdates((prev) => ({
        ...prev,
        entries: { ...prev.entries, [key]: { note: finalNote } },
      }));
      showToast?.("success", isUpdate ? "Note updated" : "Note created", "");
      return finalNote;
    } catch (err) {
      if (mountedRef.current) {
        setUpdates((prev) => {
          const newEntries = { ...prev.entries };
          if (existingNote) newEntries[key] = { note: existingNote };
          else delete newEntries[key];
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

  const handleDeleteNote = async (catId, snapId) => {
    const key = cellKey(catId, snapId);
    const existingNote = getCellNote(catId, snapId);
    if (!existingNote) return;
    setSavingCellKeys((prev) => new Set([...prev, key]));
    setUpdates((prev) => {
      const newEntries = { ...prev.entries };
      delete newEntries[key];
      return { ...prev, entries: newEntries };
    });
    try {
      if (!String(existingNote.id).startsWith("temp_")) {
        await sharingApi.deleteNote(projectId, existingNote.id);
      }
      showToast?.("success", "Note deleted", "");
    } catch (err) {
      if (mountedRef.current) {
        setUpdates((prev) => ({
          ...prev,
          entries: { ...prev.entries, [key]: { note: existingNote } },
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

  const handleShareCategory = async (categoryId, newSharedWith) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;
    const userIds = newSharedWith.map((u) => u.userId);
    try {
      await apiShareCategory(
        categoryId,
        userIds,
        category.sharedWith,
        category.name,
      );
      setShareCategoryId(null);
    } catch (err) {}
  };

  const handleBulkShareUpdate = async (sharingResult) => {
    try {
      await apiBulkUpdate(sharingResult, categories);
      setManageSharingOpen(false);
    } catch (err) {}
  };

  // ══ RENDER ══
  if (isLoading && !updates) return <LoadingSkeleton />;
  if (loadError && !updates)
    return <ErrorState error={loadError} onRetry={() => fetchUpdates(true)} />;
  if (!updates) return null;

  const isEmpty = categories.length === 0 && snapshots.length === 0;

  // Empty state
  if (isEmpty) {
    return (
      <div
        style={{
          background: t.bgCard,
          border: `1px dashed ${t.borderDashed}`,
          borderRadius: 12,
          padding: "60px 20px",
          textAlign: "center",
          fontFamily: "Sora,sans-serif",
          color: t.textPrimary,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: isOwner ? t.warningBg : t.bgMuted,
            color: isOwner ? t.warning : t.textFaint,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {isOwner ? <ClipboardList size={30} /> : <Lock size={30} />}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            marginBottom: 6,
            color: t.textPrimary,
          }}
        >
          {isOwner ? "Track Project Progress Updates" : "No Updates Available"}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: t.textMuted,
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
                height: 38,
                background: t.primary,
                color: t.textInverse,
                borderColor: t.primary,
                opacity: loadingTemplate ? 0.7 : 1,
                cursor: loadingTemplate ? "not-allowed" : "pointer",
              }}
            >
              {loadingTemplate ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
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

  // Main matrix view
  return (
    <div
      style={{
        fontFamily: "Sora,sans-serif",
        position: "relative",
        color: t.textPrimary,
      }}
    >
      {isRefreshing && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: 0,
            zIndex: 10,
            padding: "4px 10px",
            background: t.infoBg,
            border: `1px solid ${t.infoBorder}`,
            borderRadius: 999,
            fontSize: 10.5,
            color: t.info,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 5,
            boxShadow: t.shadowSm,
          }}
        >
          <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
          Refreshing...
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: "12px 18px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          boxShadow: t.shadowSm,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontWeight: 700,
            fontSize: 13.5,
            color: t.textPrimary,
          }}
        >
          <ClipboardList size={16} color={t.warning} />
          Progress Updates
        </div>
        <div style={{ fontSize: 11.5, color: t.textMuted }}>
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
              style={{ ...btnStyle, opacity: isRefreshing ? 0.6 : 1 }}
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
                    background: t.violetBg,
                    color: t.violet,
                    borderColor: t.violetBorder,
                  }}
                >
                  <Plus size={13} /> Add Category
                </button>
                {categories.length > 0 && (
                  <button
                    onClick={() => setManageSharingOpen(true)}
                    style={{
                      ...btnStyle,
                      background: t.successBgSubtle,
                      color: t.success,
                      borderColor: t.successBorder,
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
                  background: t.primary,
                  color: t.textInverse,
                  borderColor: t.primary,
                }}
              >
                <Calendar size={13} /> Add Update
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role banner */}
      {!readOnly && !isOwner && (
        <div
          style={{
            padding: "10px 14px",
            background: editableCount > 0 ? t.infoBg : t.warningBgSubtle,
            border: `1px solid ${editableCount > 0 ? t.infoBorder : t.warningBorder}`,
            borderRadius: 8,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: editableCount > 0 ? t.info : t.warning,
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
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    width: 240,
                    minWidth: 240,
                    padding: "12px 16px",
                    background: t.primary,
                    color: t.textInverse,
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
                        background: isPast ? t.textSecondary : t.primary,
                        color: t.textInverse,
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
                            style={{ animation: "spin 1s linear infinite" }}
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
                                color: t.textInverse,
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
                        borderBottom: `1px solid ${t.borderSubtle}`,
                        borderRight: `1px solid ${t.border}`,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isLocked ? t.textFaint : t.textPrimary,
                        position: "sticky",
                        left: 0,
                        background: isLocked
                          ? t.bgSubtle
                          : catIdx % 2 === 0
                            ? t.bgCard
                            : t.bgSubtle,
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
                              color: t.primary,
                            }}
                          />
                        ) : isLocked ? (
                          <Lock size={12} color={t.textFaint} />
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
                                      ? t.primaryBg
                                      : t.successBg,
                                  color:
                                    role === "collaborator"
                                      ? t.primary
                                      : t.success,
                                  border: `1px solid ${role === "collaborator" ? t.primaryBorder : t.successBorder}`,
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
                                    border: `1px solid ${t.successBorder}`,
                                    background: t.successBgSubtle,
                                    cursor: "pointer",
                                    color: t.success,
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
                                    border: `1px solid ${t.border}`,
                                    background: t.bgCard,
                                    cursor: "pointer",
                                    color: t.textMuted,
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
                                    border: `1px solid ${t.dangerBorder}`,
                                    background: t.dangerBgSubtle,
                                    cursor: "pointer",
                                    color: t.danger,
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
