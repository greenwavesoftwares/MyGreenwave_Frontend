import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useTheme } from "../useTheme";
import {
  makeLabelStyle,
  makeInputStyle,
  makeBtnStyle,
} from "../helpers/styles";

/**
 * Comments & action points editor for a single activity row.
 * - Lists existing comments in a table
 * - Bottom form to add a new comment
 */
export default function CommentsModal({ row, onClose, onUpdate }) {
  const { t } = useTheme();
  const labelStyle = makeLabelStyle(t);
  const inputStyle = makeInputStyle(t);
  const btnStyle = makeBtnStyle(t);

  const [desc, setDesc] = useState("");
  const [action, setAction] = useState("");
  const [resDate, setResDate] = useState("");
  const [respGW, setRespGW] = useState(false);
  const [respCust, setRespCust] = useState(false);
  const [others, setOthers] = useState("");

  const handleAdd = () => {
    if (!desc.trim()) return;
    const newComment = {
      sno: (row.comments || []).length + 1,
      description: desc.trim(),
      actionPoint: action.trim(),
      resolutionDate: resDate,
      responsibility: [respGW && "GW", respCust && "Customer"].filter(Boolean),
      others: others.trim(),
      attachments: [],
      author: "You",
      time: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      replies: [],
    };
    onUpdate({ ...row, comments: [...(row.comments || []), newComment] });
    setDesc("");
    setAction("");
    setResDate("");
    setRespGW(false);
    setRespCust(false);
    setOthers("");
  };

  const deleteComment = (idx) => {
    const updated = (row.comments || []).filter((_, i) => i !== idx);
    onUpdate({ ...row, comments: updated });
  };

  const fmtDate = (s) => {
    if (!s) return "—";
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
          maxWidth: 860,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: t.shadowXl,
          fontFamily: "Sora,sans-serif",
          overflow: "hidden",
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
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            💬
          </div>
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              Comments & Action Points
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>
              {row.task || row.module || `Activity #${row.id}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textFaint,
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Existing comments */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {!(row.comments || []).length ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: t.textFaint,
                fontSize: 12,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>💭</div>
              No entries yet — add the first entry below.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11.5,
              }}
            >
              <thead>
                <tr style={{ background: t.bgSubtle }}>
                  {[
                    "#",
                    "Description",
                    "Action Point",
                    "Resolution Date",
                    "Responsibility",
                    "Others",
                    "Added",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: t.textMuted,
                        borderBottom: `1px solid ${t.border}`,
                        fontSize: 10,
                        letterSpacing: "0.4px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(row.comments || []).map((c, i) => (
                  <tr
                    key={i}
                    style={{
                      borderLeft: `3px solid ${i % 2 === 0 ? t.primary : t.violet}`,
                      borderBottom: `1px solid ${t.borderSubtle}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 10px",
                        color: t.textFaint,
                        fontWeight: 600,
                      }}
                    >
                      {c.sno || i + 1}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        maxWidth: 180,
                        color: t.textPrimary,
                      }}
                    >
                      {c.description || "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        maxWidth: 160,
                        color: t.textSecondary,
                      }}
                    >
                      {c.actionPoint || (
                        <span style={{ color: t.textDisabled }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11,
                        whiteSpace: "nowrap",
                        color: t.textSecondary,
                      }}
                    >
                      {fmtDate(c.resolutionDate)}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {(c.responsibility || []).map((v) => (
                          <span
                            key={v}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 600,
                              background: v === "GW" ? t.primaryBg : "#FCE7F3",
                              color: v === "GW" ? t.primary : "#BE185D",
                              border: `1px solid ${v === "GW" ? t.primaryBorder : "#F9A8D4"}`,
                            }}
                          >
                            {v}
                          </span>
                        ))}
                        {!(c.responsibility || []).length && (
                          <span style={{ color: t.textDisabled }}>—</span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: t.textSecondary,
                        maxWidth: 120,
                      }}
                    >
                      {c.others || (
                        <span style={{ color: t.textDisabled }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: t.textPrimary,
                          fontSize: 11,
                        }}
                      >
                        {c.author || "You"}
                      </div>
                      <div
                        style={{
                          color: t.textFaint,
                          fontSize: 10,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {c.time || ""}
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      <button
                        onClick={() => deleteComment(i)}
                        title="Delete"
                        style={{
                          background: "none",
                          border: `1px solid ${t.dangerBorder}`,
                          color: t.danger,
                          borderRadius: 6,
                          padding: "3px 8px",
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add form */}
        <div
          style={{
            borderTop: `1px solid ${t.border}`,
            padding: "14px 20px",
            background: t.bgSubtle,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 12,
              color: t.textPrimary,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={12} style={{ marginRight: 8 }} />
            Add new entry
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr 1fr 1.4fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>
                Description <span style={{ color: t.danger }}>*</span>
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What happened…"
                style={{
                  ...inputStyle,
                  height: 34,
                  resize: "vertical",
                  paddingTop: 7,
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Action Point</label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Next step…"
                style={{
                  ...inputStyle,
                  height: 34,
                  resize: "vertical",
                  paddingTop: 7,
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Resolution Date</label>
              <input
                type="date"
                value={resDate}
                onChange={(e) => setResDate(e.target.value)}
                style={{
                  ...inputStyle,
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Responsibility</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[
                  ["GW", t.primary, t.primaryBg],
                  ["Customer", "#BE185D", "#FCE7F3"],
                ].map(([v, c, bg]) => (
                  <label
                    key={v}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={v === "GW" ? respGW : respCust}
                      onChange={(e) =>
                        v === "GW"
                          ? setRespGW(e.target.checked)
                          : setRespCust(e.target.checked)
                      }
                      style={{ display: "none" }}
                    />
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                        background: (v === "GW" ? respGW : respCust)
                          ? bg
                          : t.bgMuted,
                        color: (v === "GW" ? respGW : respCust)
                          ? c
                          : t.textFaint,
                        border: `1.5px solid ${(v === "GW" ? respGW : respCust) ? c : t.border}`,
                        cursor: "pointer",
                        transition: "all .12s",
                      }}
                    >
                      {v}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Others</label>
              <textarea
                value={others}
                onChange={(e) => setOthers(e.target.value)}
                placeholder="Other notes…"
                style={{
                  ...inputStyle,
                  height: 34,
                  resize: "vertical",
                  paddingTop: 7,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={btnStyle}>
              <X size={18} /> Cancel
            </button>
            <button
              onClick={handleAdd}
              style={{
                ...btnStyle,
                background: t.primary,
                color: t.textInverse,
                borderColor: t.primary,
              }}
            >
              <Plus size={12} /> Add Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
