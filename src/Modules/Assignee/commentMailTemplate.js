import dayjs from "dayjs";

/**
 * Builds the e-mail that is sent from the "Comments & Action Points" box.
 *
 * - Table based layout + inline styles only (works in Outlook, Gmail, mobile).
 * - Every user-typed value is HTML-escaped.
 * - Returns { subject, html, text } so the backend can send a multipart mail.
 */

const BRAND = "#1d4ed8";
const BRAND_DARK = "#1e3a8a";
const TEXT = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SOFT_BG = "#f3f4f6";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Keeps the line breaks the user typed in multiline fields.
const multiline = (value) => escapeHtml(value).replace(/\r?\n/g, "<br/>");

const formatDate = (value) =>
  value && dayjs(value).isValid() ? dayjs(value).format("DD MMM YYYY") : "—";

const ownerLabel = (responsibility) => {
  const list = Array.isArray(responsibility)
    ? responsibility
    : String(responsibility || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  return list.length ? list.join(", ") : "—";
};

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const row = (label, valueHtml) => `
  <tr>
    <td style="padding:12px 16px;width:150px;vertical-align:top;background:${SOFT_BG};border-bottom:1px solid ${BORDER};font-size:13px;font-weight:600;color:${MUTED};">${escapeHtml(label)}</td>
    <td style="padding:12px 16px;vertical-align:top;border-bottom:1px solid ${BORDER};font-size:14px;line-height:1.55;color:${TEXT};">${valueHtml}</td>
  </tr>`;

export function buildCommentMail({
  projectName,
  activityName,
  activityStatus,
  comment,
  senderName,
  senderEmail,
  personalNote,
}) {
  const description = comment?.commentDescription;
  const actionPoint = comment?.actionPoint;
  const others = comment?.others;
  const resolutionDate = formatDate(comment?.resolutionDate);
  const owner = ownerLabel(comment?.responsibility);
  const hasAttachment = !!comment?.attachmentName;

  const subjectParts = [
    "Action Point",
    projectName ? `[${projectName}]` : null,
    activityName ? `${activityName}` : null,
  ].filter(Boolean);
  const subject = `${subjectParts[0]}${
    subjectParts.length > 1 ? " – " + subjectParts.slice(1).join(" ") : ""
  } | Due ${resolutionDate}`;

  const rows = [
    row("Description", multiline(description || "—")),
    isFilled(actionPoint) ? row("Action Point", multiline(actionPoint)) : "",
    row(
      "Resolution Date",
      `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#dbeafe;color:${BRAND_DARK};font-weight:600;font-size:13px;">${escapeHtml(resolutionDate)}</span>`,
    ),
    row("Owner", escapeHtml(owner)),
    isFilled(others) ? row("Other Notes", multiline(others)) : "",
    hasAttachment
      ? row("Attachment", `&#128206; ${escapeHtml(comment.attachmentName)}`)
      : "",
  ].join("");

  const noteBlock = isFilled(personalNote)
    ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${TEXT};">${multiline(personalNote)}</p>`
    : `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${TEXT};">Hi,<br/>A new action point has been recorded and needs your attention.</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${SOFT_BG};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT_BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:${BRAND};padding:22px 24px;">
            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;">Action Point Notification</div>
            <div style="margin-top:6px;font-size:20px;font-weight:700;color:#ffffff;">${escapeHtml(activityName || "Activity")}</div>
            ${
              projectName
                ? `<div style="margin-top:4px;font-size:13px;color:#dbeafe;">Project: ${escapeHtml(projectName)}</div>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            ${noteBlock}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:8px;border-collapse:separate;overflow:hidden;">
              ${
                isFilled(activityStatus)
                  ? row("Activity Status", escapeHtml(activityStatus))
                  : ""
              }
              ${rows}
            </table>
            <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
              Please review and update the activity once this is addressed.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:${SOFT_BG};border-top:1px solid ${BORDER};font-size:12px;line-height:1.6;color:${MUTED};">
            Sent by <strong style="color:${TEXT};">${escapeHtml(senderName || senderEmail || "Activity Tracker")}</strong>${
              senderEmail && senderName
                ? ` (${escapeHtml(senderEmail)})`
                : ""
            } via Activity Tracker.<br/>
            This is an automated notification. Please do not share sensitive information over e-mail.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "ACTION POINT NOTIFICATION",
    projectName ? `Project: ${projectName}` : null,
    activityName ? `Activity: ${activityName}` : null,
    isFilled(activityStatus) ? `Status: ${activityStatus}` : null,
    "",
    isFilled(personalNote) ? personalNote : null,
    isFilled(personalNote) ? "" : null,
    `Description: ${description || "—"}`,
    isFilled(actionPoint) ? `Action Point: ${actionPoint}` : null,
    `Resolution Date: ${resolutionDate}`,
    `Owner: ${owner}`,
    isFilled(others) ? `Other Notes: ${others}` : null,
    hasAttachment ? `Attachment: ${comment.attachmentName}` : null,
    "",
    `Sent by ${senderName || senderEmail || "Activity Tracker"} via Activity Tracker.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return { subject, html, text };
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
