import React, { useState, useRef } from "react";
import {
  X,
  CheckCircle2,
  Paperclip,
  Plus,
  Loader2,
  AlertTriangle,
  FileText,
  File as FileIcon,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { useTheme } from "../useTheme";
import { useResponsive } from "../useResponsive";
import BottomSheet from "../shared/BottomSheet";
import { makeBtnStyle } from "../helpers/styles";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeIcon(fileName) {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return ImageIcon;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["doc", "docx", "pdf", "txt"].includes(ext)) return FileText;
  return FileIcon;
}

function readFileAsBase64Raw(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadBase64File(file) {
  if (!file?.data) return;
  const dataUrl = file.data.startsWith("data:")
    ? file.data
    : `data:${file.type || "application/octet-stream"};base64,${file.data}`;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = file.name || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ExternalClosureModal({
  project,
  onClose,
  onConfirm,
  isSubmitting = false,
  readOnly = false,
  savedFeedback = null,
}) {
  const { t } = useTheme();
  const { isMobile } = useResponsive();
  const btnStyle = makeBtnStyle(t);

  // ── Load External Closure supporting documents from savedFeedback ──
  const [supportingDocs, setSupportingDocs] = useState(() => {
    if (readOnly && Array.isArray(savedFeedback?.closures)) {
      const externalClosure = savedFeedback.closures.find(
        (c) => c.closureType === "External Closure",
      );
      if (
        externalClosure &&
        Array.isArray(externalClosure.supportingDocuments) &&
        externalClosure.supportingDocuments.length > 0
      ) {
        return externalClosure.supportingDocuments.map((doc, idx) => ({
          id: `saved_${idx}`,
          statement: doc.statement || "",
          file: doc.file || null,
        }));
      }
    }
    return [
      {
        id: `entry_${Date.now()}`,
        statement: "",
        file: null,
      },
    ];
  });

  const [uploadingIds, setUploadingIds] = useState(new Set());
  const [uploadError, setUploadError] = useState(null);

  const addSupportingDoc = () => {
    setSupportingDocs((prev) => [
      ...prev,
      {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        statement: "",
        file: null,
      },
    ]);
  };

  const removeSupportingDoc = (id) => {
    setSupportingDocs((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (filtered.length === 0) {
        return [{ id: `entry_${Date.now()}`, statement: "", file: null }];
      }
      return filtered;
    });
  };

  const updateSupportingStatement = (id, val) => {
    setSupportingDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, statement: val } : d)),
    );
  };

  const handleFileSelect = async (id, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        `File too large. Max size is ${MAX_FILE_SIZE_MB} MB. Got ${formatFileSize(file.size)}.`,
      );
      event.target.value = "";
      return;
    }
    setUploadError(null);
    setUploadingIds((prev) => new Set([...prev, id]));
    try {
      const base64 = await readFileAsBase64Raw(file);
      setSupportingDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                file: {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  data: base64,
                  uploadedAt: new Date().toISOString(),
                },
              }
            : d,
        ),
      );
    } catch (err) {
      setUploadError(err.message || "Failed to read file");
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      event.target.value = "";
    }
  };

  const removeSupportingFile = (id) => {
    setSupportingDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, file: null } : d)),
    );
  };

  const handleSubmit = async () => {
    const externalSupportingDocs = supportingDocs
      .filter((d) => (d.statement || "").trim().length > 0 || d.file)
      .map((d) => ({
        statement: (d.statement || "").trim(),
        file: d.file
          ? {
              name: d.file.name,
              data: d.file.data,
            }
          : null,
      }));

    const closures = [];
    if (externalSupportingDocs.length > 0) {
      closures.push({
        closureType: "External Closure",
        supportingDocuments: externalSupportingDocs,
      });
    }

    const payload = {
      status: "finished",
      closures,
    };

    // 🔍 DEBUG log
    console.log("═══ ExternalClosureModal Payload ═══");
    console.log("📦 Full payload:", payload);
    console.log(
      "📄 JSON:",
      JSON.stringify(
        payload,
        (key, value) => {
          if (
            key === "data" &&
            typeof value === "string" &&
            value.length > 80
          ) {
            return `${value.substring(0, 60)}... [${value.length} chars]`;
          }
          return value;
        },
        2,
      ),
    );
    console.log("════════════════════════════════════");

    await onConfirm(payload);
  };

  const modalTitle = readOnly
    ? "External Closure Details"
    : "Mark Project as Finished";

  /* ─── Body content ─── */
  const bodyContent = (
    <div style={{ padding: isMobile ? "16px 14px" : "20px" }}>
      {/* Info banner */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: 10,
            background: t.successBgSubtle,
            border: `1px solid ${t.successBorder}`,
            borderRadius: 8,
            marginBottom: 18,
          }}
        >
          <CheckCircle2
            size={16}
            color={t.success}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div style={{ fontSize: 12, color: t.success, lineHeight: 1.5 }}>
            This will mark the project as <strong>Finished</strong> — externally
            closed. You can still perform Internal Closure afterward.
          </div>
        </div>
      )}

      {/* ═══ Supporting Documents Section ═══ */}
      <div
        style={{
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: isMobile ? 12 : 16,
          marginBottom: 18,
          background: t.bgSubtle,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: t.infoBg,
              color: t.info,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Paperclip size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 13, color: t.textPrimary }}
            >
              Supporting Documents for External Closure
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>
              Add statements and evidence files (optional)
            </div>
          </div>
        </div>

        {/* Upload error banner */}
        {uploadError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 10,
              background: t.dangerBgSubtle,
              border: `1px solid ${t.dangerBorder}`,
              borderRadius: 7,
              marginBottom: 12,
              fontSize: 11.5,
              color: t.dangerTextDeep || t.danger,
            }}
          >
            <AlertTriangle size={14} color={t.danger} />
            <span style={{ flex: 1 }}>{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: t.danger,
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Doc entries */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {supportingDocs.map((doc, idx) => {
            const isUploading = uploadingIds.has(doc.id);
            const canRemove =
              supportingDocs.length > 1 || doc.statement || doc.file;
            const FileTypeIcon = doc.file
              ? getFileTypeIcon(doc.file.name)
              : Paperclip;

            return (
              <div
                key={doc.id}
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  padding: 12,
                  background: t.bgCard,
                  position: "relative",
                }}
              >
                {/* Entry header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background: t.infoBg,
                      color: t.info,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: t.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    Supporting Entry
                  </span>

                  {!readOnly && canRemove && (
                    <button
                      onClick={() => removeSupportingDoc(doc.id)}
                      title="Remove this entry"
                      disabled={isSubmitting || isUploading}
                      style={{
                        marginLeft: "auto",
                        width: 26,
                        height: 26,
                        borderRadius: 5,
                        border: `1px solid ${t.dangerBorder}`,
                        background: t.dangerBgSubtle,
                        color: t.danger,
                        cursor:
                          isSubmitting || isUploading
                            ? "not-allowed"
                            : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        flexShrink: 0,
                        opacity: isSubmitting || isUploading ? 0.5 : 1,
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Statement */}
                <div style={{ marginBottom: 10 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: t.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Supported Statement
                  </label>
                  {readOnly ? (
                    <div
                      style={{
                        width: "100%",
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontFamily: "Sora, sans-serif",
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: t.textPrimary,
                        background: t.bgSubtle,
                        minHeight: 40,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {doc.statement || (
                        <span
                          style={{ color: t.textFaint, fontStyle: "italic" }}
                        >
                          (no statement)
                        </span>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={doc.statement}
                      onChange={(e) =>
                        updateSupportingStatement(doc.id, e.target.value)
                      }
                      placeholder="Describe the supporting context..."
                      rows={3}
                      disabled={isSubmitting || isUploading}
                      style={{
                        width: "100%",
                        border: `1px solid ${t.borderStrong}`,
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontFamily: "Sora, sans-serif",
                        fontSize: isMobile ? 14 : 12,
                        lineHeight: 1.5,
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "vertical",
                        minHeight: 60,
                        background:
                          isSubmitting || isUploading
                            ? t.bgInputDisabled
                            : t.bgInput,
                        color: t.textPrimary,
                      }}
                    />
                  )}
                </div>

                {/* File */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: t.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Supported Document
                  </label>

                  {doc.file ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: t.infoBg,
                        border: `1px solid ${t.infoBorder}`,
                        borderRadius: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 5,
                          background: t.bgCard,
                          color: t.info,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileTypeIcon size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: t.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={doc.file.name}
                        >
                          {doc.file.name}
                        </div>
                        {doc.file.size && (
                          <div
                            style={{
                              fontSize: 10,
                              color: t.textMuted,
                              marginTop: 1,
                            }}
                          >
                            {formatFileSize(doc.file.size)}
                          </div>
                        )}
                      </div>

                      {readOnly && (
                        <button
                          onClick={() => downloadBase64File(doc.file)}
                          title="Download"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 5,
                            border: `1px solid ${t.infoBorder}`,
                            background: t.bgCard,
                            color: t.info,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            flexShrink: 0,
                          }}
                        >
                          <Download size={13} />
                        </button>
                      )}

                      {!readOnly && (
                        <button
                          onClick={() => removeSupportingFile(doc.id)}
                          title="Remove file"
                          disabled={isSubmitting || isUploading}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 5,
                            border: `1px solid ${t.dangerBorder}`,
                            background: t.dangerBgSubtle,
                            color: t.danger,
                            cursor:
                              isSubmitting || isUploading
                                ? "not-allowed"
                                : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            flexShrink: 0,
                            opacity: isSubmitting || isUploading ? 0.5 : 1,
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ) : readOnly ? (
                    <div
                      style={{
                        padding: "10px 12px",
                        background: t.bgSubtle,
                        border: `1px dashed ${t.border}`,
                        borderRadius: 6,
                        fontSize: 11,
                        color: t.textFaint,
                        fontStyle: "italic",
                        textAlign: "center",
                      }}
                    >
                      (no file attached)
                    </div>
                  ) : (
                    <FileUploadButton
                      docId={doc.id}
                      isUploading={isUploading}
                      isSubmitting={isSubmitting}
                      onFileSelect={handleFileSelect}
                      t={t}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!readOnly && (
          <button
            onClick={addSupportingDoc}
            disabled={isSubmitting || uploadingIds.size > 0}
            style={{
              marginTop: 12,
              width: "100%",
              height: isMobile ? 44 : 38,
              borderRadius: 8,
              border: `1.5px dashed ${t.primaryBorder}`,
              background: t.primaryBgSubtle,
              color: t.primary,
              cursor:
                isSubmitting || uploadingIds.size > 0
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "Sora, sans-serif",
              fontSize: isMobile ? 13 : 12,
              fontWeight: 600,
              opacity: isSubmitting || uploadingIds.size > 0 ? 0.6 : 1,
            }}
          >
            <Plus size={14} /> Add Another Supporting Document
          </button>
        )}
      </div>
    </div>
  );

  /* ─── Footer buttons ─── */
  const footerButtons = readOnly ? (
    <button
      onClick={onClose}
      style={{
        ...btnStyle,
        flex: isMobile ? 1 : "initial",
        height: isMobile ? 46 : 32,
        justifyContent: "center",
        fontSize: isMobile ? 14 : 12,
        fontWeight: isMobile ? 600 : 500,
      }}
    >
      <X size={13} /> Close
    </button>
  ) : (
    <>
      <button
        onClick={onClose}
        disabled={isSubmitting}
        style={{
          ...btnStyle,
          flex: isMobile ? 1 : "initial",
          height: isMobile ? 46 : 32,
          justifyContent: "center",
          fontSize: isMobile ? 14 : 12,
          fontWeight: isMobile ? 600 : 500,
          opacity: isSubmitting ? 0.5 : 1,
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        <X size={13} /> Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{
          ...btnStyle,
          flex: isMobile ? 1.2 : "initial",
          height: isMobile ? 46 : 32,
          background: t.success,
          color: t.textInverse,
          borderColor: t.success,
          justifyContent: "center",
          fontSize: isMobile ? 14 : 12,
          fontWeight: isMobile ? 700 : 600,
          opacity: isSubmitting ? 0.6 : 1,
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Marking...
          </>
        ) : (
          <>
            <CheckCircle2 size={14} /> Mark as Finished
          </>
        )}
      </button>
    </>
  );

  // ─── MOBILE ───
  if (isMobile) {
    return (
      <BottomSheet
        open={true}
        onClose={onClose}
        title={modalTitle}
        height="full"
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: readOnly ? t.violetBg : t.successBgSubtle,
              borderBottom: `1px solid ${t.border}`,
              fontSize: 12,
              color: readOnly ? t.violet : t.success,
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircle2 size={14} />
            <span style={{ fontWeight: 600 }}>
              {project || "Untitled Project"}
            </span>
            {readOnly && (
              <span
                style={{
                  marginLeft: "auto",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  background: t.violetBg,
                  color: t.violet,
                  border: `1px solid ${t.violetBorder}`,
                  textTransform: "uppercase",
                }}
              >
                Read Only
              </span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>{bodyContent}</div>
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${t.border}`,
              display: "flex",
              gap: 8,
              background: t.bgSubtle,
            }}
          >
            {footerButtons}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ─── DESKTOP ───
  return (
    <div
      onClick={(e) =>
        e.target === e.currentTarget && !isSubmitting && onClose()
      }
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
          borderRadius: 14,
          width: "100%",
          maxWidth: 620,
          maxHeight: "92vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: t.textPrimary,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: readOnly ? t.violetBg : t.successBgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: readOnly ? t.violetBg : t.successBg,
              color: readOnly ? t.violet : t.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={20} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {modalTitle}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: t.textMuted,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project || "Untitled Project"}
            </div>
          </div>

          {readOnly && (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                background: t.violetBg,
                color: t.violet,
                border: `1px solid ${t.violetBorder}`,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Read Only
            </span>
          )}

          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isSubmitting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>{bodyContent}</div>

        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          {footerButtons}
        </div>
      </div>
    </div>
  );
}

/* ─── File Upload Button ─── */
function FileUploadButton({
  docId,
  isUploading,
  isSubmitting,
  onFileSelect,
  t,
}) {
  const inputRef = useRef(null);

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || isSubmitting}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 6,
          border: `1.5px dashed ${t.infoBorder}`,
          background: t.infoBg,
          color: t.info,
          cursor: isUploading || isSubmitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontFamily: "Sora, sans-serif",
          fontSize: 12.5,
          fontWeight: 600,
          opacity: isUploading || isSubmitting ? 0.6 : 1,
        }}
      >
        {isUploading ? (
          <>
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Uploading...
          </>
        ) : (
          <>
            <Paperclip size={14} /> Attach File
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        onChange={(e) => onFileSelect(docId, e)}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp"
      />
    </>
  );
}
