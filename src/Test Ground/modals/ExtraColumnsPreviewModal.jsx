import React, { useState } from "react";
import { X, Plus, Info, Check, Loader2 } from "lucide-react";
import { useTheme } from "../useTheme";
import { makeBtnStyle } from "../helpers/styles";

/**
 * Preview modal shown after an Excel upload when extra (non-hardcoded)
 * columns are detected. User can select which to import as custom columns.
 *
 * extras shape:
 *   [{ name, filledCount, totalRows, willMerge, existingColumnId }]
 */
export default function ExtraColumnsPreviewModal({
  extras,
  onClose,
  onConfirm,
  isProcessing = false,
}) {
  const { t } = useTheme();
  const btnStyle = makeBtnStyle(t);

  const [selected, setSelected] = useState(
    () => new Set(extras.map((e) => e.name)),
  );

  const toggleColumn = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === extras.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(extras.map((e) => e.name)));
    }
  };

  const handleConfirm = () => {
    const selectedExtras = extras.filter((e) => selected.has(e.name));
    onConfirm(selectedExtras);
  };

  const mergeCount = extras.filter(
    (e) => e.willMerge && selected.has(e.name),
  ).length;
  const newCount = extras.filter(
    (e) => !e.willMerge && selected.has(e.name),
  ).length;

  return (
    <div
      onClick={(e) =>
        !isProcessing && e.target === e.currentTarget && onClose()
      }
      style={{
        position: "fixed",
        inset: 0,
        background: t.bgOverlay,
        zIndex: 1002,
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
          maxWidth: 560,
          maxHeight: "88vh",
          fontFamily: "Sora,sans-serif",
          boxShadow: t.shadowXl,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.border}`,
            background: t.bgSubtle,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: t.violetBg,
              color: t.violet,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Plus size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, fontSize: 14.5, color: t.textPrimary }}
            >
              Extra Columns Detected
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
              We found <strong>{extras.length}</strong> column
              {extras.length !== 1 ? "s" : ""} not in the template. Import as
              custom column{extras.length !== 1 ? "s" : ""}?
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: "none",
              border: "none",
              cursor: isProcessing ? "not-allowed" : "pointer",
              color: t.textFaint,
              padding: 4,
              opacity: isProcessing ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {/* Select All Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: `1px dashed ${t.border}`,
            }}
          >
            <button
              onClick={toggleAll}
              style={{
                background: "none",
                border: "none",
                color: t.primary,
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 600,
                padding: 0,
                fontFamily: "Sora,sans-serif",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {selected.size === extras.length ? (
                <>
                  <X size={11} /> Deselect All
                </>
              ) : (
                <>
                  <Check size={11} /> Select All
                </>
              )}
            </button>
            <span style={{ fontSize: 11, color: t.textMuted }}>
              {selected.size} of {extras.length} selected
            </span>
          </div>

          {/* Column List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {extras.map((extra) => {
              const isSelected = selected.has(extra.name);
              const isMerge = extra.willMerge;

              return (
                <label
                  key={extra.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    background: isSelected
                      ? isMerge
                        ? t.warningBgSubtle
                        : t.primaryBgSubtle
                      : t.bgSubtle,
                    border: `1.5px solid ${
                      isSelected
                        ? isMerge
                          ? t.warningBorder
                          : t.primaryBorder
                        : t.border
                    }`,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all .12s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleColumn(extra.name)}
                    style={{ display: "none" }}
                  />
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: `2px solid ${
                        isSelected
                          ? isMerge
                            ? t.warning
                            : t.primary
                          : t.borderStrong
                      }`,
                      background: isSelected
                        ? isMerge
                          ? t.warning
                          : t.primary
                        : t.bgCard,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: t.textInverse,
                    }}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: t.textPrimary,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 240,
                        }}
                      >
                        {extra.name}
                      </span>
                      {isMerge ? (
                        <span
                          style={{
                            padding: "1px 7px",
                            background: t.warningBg,
                            color: t.warning,
                            border: `1px solid ${t.warningBorder}`,
                            borderRadius: 999,
                            fontSize: 9.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                          }}
                        >
                          Merge
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: "1px 7px",
                            background: t.successBg,
                            color: t.success,
                            border: `1px solid ${t.successBorder}`,
                            borderRadius: 999,
                            fontSize: 9.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: t.textMuted,
                        marginTop: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {isMerge ? (
                        <>
                          <Info size={10} />
                          Will merge into existing column
                        </>
                      ) : (
                        <>
                          <Plus size={10} />
                          Will create new custom column
                        </>
                      )}
                      <span style={{ color: t.textFaint }}>•</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color:
                            extra.filledCount > 0 ? t.success : t.textFaint,
                        }}
                      >
                        {extra.filledCount}/{extra.totalRows} rows have values
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Summary banner */}
          {(mergeCount > 0 || newCount > 0) && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                background: t.infoBg,
                border: `1px solid ${t.infoBorder}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 11,
                color: t.info,
                lineHeight: 1.5,
              }}
            >
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Summary:</strong>
                {newCount > 0 &&
                  ` ${newCount} new custom column${newCount !== 1 ? "s" : ""} will be created.`}
                {mergeCount > 0 &&
                  ` ${mergeCount} column${mergeCount !== 1 ? "s" : ""} will merge into existing custom column${mergeCount !== 1 ? "s" : ""}.`}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              ...btnStyle,
              opacity: isProcessing ? 0.6 : 1,
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            <X size={13} /> Skip Extra Columns
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            style={{
              ...btnStyle,
              background: t.primary,
              color: t.textInverse,
              borderColor: t.primary,
              cursor: isProcessing ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isProcessing ? (
              <>
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Importing...
              </>
            ) : (
              <>
                <Check size={13} />
                Import {selected.size} Column{selected.size !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
