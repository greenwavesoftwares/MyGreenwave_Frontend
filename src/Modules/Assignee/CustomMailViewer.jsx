import { Buffer } from "buffer";
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import PostalMime from "postal-mime";
import MsgReader from "@kenjiuno/msgreader";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import "./CustomViews.css";
import { ViewIcon } from "lucide-react";

const EML_TYPES = ["eml", "message/rfc822"];
const MSG_TYPES = ["msg", "application/vnd.ms-outlook"];

/** Normalizes postal-mime's attachment.content (ArrayBuffer | Uint8Array | base64/utf8 string)
 *  into a Uint8Array so it can be wrapped in a Blob for download regardless of which shape
 *  it came back as. */
function contentToUint8Array(content, encoding) {
  if (content instanceof Uint8Array) return content;
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  if (typeof content === "string") {
    if (encoding === "base64") {
      const binary = atob(content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    return new TextEncoder().encode(content);
  }
  return new Uint8Array();
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

/** Decide "eml" vs "msg" from whatever metadata the viewer gives us. */
function detectKind(currentDocument) {
  const fileType = (currentDocument.fileType || "").toLowerCase();
  const name = (currentDocument.uri || currentDocument.name || "").toLowerCase();

  if (EML_TYPES.includes(fileType) || name.endsWith(".eml")) return "eml";
  if (MSG_TYPES.includes(fileType) || name.endsWith(".msg")) return "msg";
  return null;
}

/** Normalize fileData (data URI, ArrayBuffer, Uint8Array, Blob) to an ArrayBuffer. */
async function toArrayBuffer(fileData) {
  if (fileData instanceof ArrayBuffer) return fileData;
  if (fileData instanceof Uint8Array) return fileData.buffer;
  if (fileData instanceof Blob) return await fileData.arrayBuffer();
  if (typeof fileData === "string" && fileData.startsWith("data:")) {
    const base64 = fileData.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  throw new Error("Unsupported fileData format");
}

/** Parse a .eml file into the normalized shape the UI expects. */
async function parseEml(fileData) {
  // postal-mime accepts ArrayBuffer, Blob, or string directly
  const input =
    typeof fileData === "string" && !fileData.startsWith("data:")
      ? fileData // raw MIME text
      : await toArrayBuffer(fileData);

  const parsed = await PostalMime.parse(input);
  const toRecipient = (r) => ({ name: r.name || r.address || "", address: r.address || "" });

  return {
    fromName: parsed.from?.name || "",
    fromAddress: parsed.from?.address || "",
    to: (parsed.to || []).map(toRecipient),
    cc: (parsed.cc || []).map(toRecipient),
    subject: parsed.subject || "(no subject)",
    date: parsed.date ? new Date(parsed.date) : null,
    html: parsed.html || null,
    text: parsed.text || null,
    attachments: (parsed.attachments || [])
      .filter((a) => a.filename)
      .map((a) => {
        const bytes = contentToUint8Array(a.content, a.encoding);
        const blob = new Blob([bytes], { type: a.mimeType || "application/octet-stream" });
        return { filename: a.filename, size: bytes.byteLength, url: URL.createObjectURL(blob) };
      }),
  };
}

/** Parse a .msg file into the normalized shape the UI expects. */
async function parseMsg(fileData) {
  const buffer = await toArrayBuffer(fileData);
  const reader = new MsgReader(buffer);
  const info = reader.getFileData();
  const recipients = info.recipients || [];
  const byType = (type) =>
    recipients
      .filter((r) => (r.recipType || "to").toLowerCase() === type)
      .map((r) => ({ name: r.name || r.email || "", address: r.email || "" }));

  return {
    fromName: info.senderName || "",
    fromAddress: info.senderEmail || "",
    to: byType("to"),
    cc: byType("cc"),
    subject: info.subject || "(no subject)",
    date: info.messageDeliveryTime ? new Date(info.messageDeliveryTime) : null,
    // NOTE: the field is `bodyHtml` (lowercase "tml"), not `bodyHTML` — the
    // previous version read the wrong key and silently always fell back to
    // plain text for every .msg file.
    html: info.bodyHtml || null,
    text: info.body || null,
    attachments: (info.attachments || [])
      .map((a) => {
        try {
          const data = reader.getAttachment(a);
          const blob = new Blob([data.content], { type: "application/octet-stream" });
          return {
            filename: data.fileName || a.fileName || "attachment",
            size: data.content.byteLength,
            url: URL.createObjectURL(blob),
          };
        } catch {
          // Some attachment types (e.g. embedded .msg-in-.msg) aren't extractable
          // this way — skip rather than fail the whole message.
          return null;
        }
      })
      .filter(Boolean),
  };
}

/** Strips <img> tags from an email's HTML body so images aren't rendered inline
 *  in the preview — they're still reachable via the Attachments list below.
 *  Falls back to the original html if parsing fails for any reason. */
function stripInlineImages(html) {
  if (!html) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("img").forEach((img) => img.remove());
    return doc.documentElement.outerHTML;
  } catch {
    return html;
  }
}

/** First letter of up to the first two words in a name, else first 2 chars of an address. */
function getInitials(name, address) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  if (address) return address.slice(0, 2).toUpperCase();
  return "?";
}

/** "Alice, Bob" + "+2 others" style summary, matching how Outlook condenses long recipient lists. */
function formatRecipients(list, maxShown = 1) {
  const names = list.map((r) => r.name || r.address).filter(Boolean);
  const shown = names.slice(0, maxShown).join(", ");
  const extra = names.length - maxShown;
  return { shown, extra: extra > 0 ? extra : 0 };
}

/**
 * One "To:" / "Cc:" line. When there are more recipients than fit inline,
 * "+N others" becomes a button that toggles a popover listing everyone.
 */
function RecipientRow({ label, list, maxShown = 1 }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const { shown, extra } = formatRecipients(list, maxShown);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (list.length === 0) return null;

  return (
    <div className="doc-mail-recipient-row">
      <span className="doc-mail-label">{label}:</span>
      <CheckCircleIcon className="doc-mail-check-icon" />
      <span className="doc-mail-value">{shown}</span>

      {extra > 0 && (
        <span className="doc-mail-more-wrap" ref={wrapRef}>
          <button
            type="button"
            className="doc-mail-more"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            +{extra} others
          </button>

          {open && (
            <ul className="doc-mail-more-popover" role="menu">
              {list.map((r, i) => (
                <li key={`${r.address || r.name}-${i}`} className="doc-mail-more-item">
                  <span className="doc-mail-more-name">{r.name || r.address}</span>
                  {r.address && r.address !== r.name && (
                    <span className="doc-mail-more-address">{r.address}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </span>
      )}
    </div>
  );
}

const CustomMailViewer = ({ mainState: { currentDocument } }) => {
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const attachmentUrlsRef = useRef([]);
  const documentViewerRef = useRef(null);
  

  useEffect(() => {
    if (!currentDocument) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEmail(null);

    // Revoke the previous document's attachment Blob URLs before creating new ones.
    attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    attachmentUrlsRef.current = [];

    (async () => {
      try {
        const kind = detectKind(currentDocument);
        let parsed;
        if (kind === "eml") {
          parsed = await parseEml(currentDocument.fileData);
        } else if (kind === "msg") {
          parsed = await parseMsg(currentDocument.fileData);
        } else {
          throw new Error("Unsupported mail format (expected .eml or .msg)");
        }
        if (!cancelled) {
          attachmentUrlsRef.current = parsed.attachments.map((a) => a.url);
          setEmail(parsed);
        } else {
          // Component moved on before this finished — don't leak the URLs we just made.
          parsed.attachments.forEach((a) => URL.revokeObjectURL(a.url));
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDocument]);

  // Revoke on unmount too.
  useEffect(() => {
    return () => {
      attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const srcDoc = useMemo(() => {
    if (!email) return "";
    if (email.html) return stripInlineImages(email.html);
    if (email.text) {
      const escaped = email.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre style="white-space:pre-wrap;font-family:inherit">${escaped}</pre>`;
    }
    return "<em>No preview available</em>";
  }, [email]);

  if (!currentDocument) return null;
  if (loading) return <p className="doc-mail-loading">Loading email…</p>;
  if (error) {
    return (
      <p className="doc-mail-error">
        Couldn't preview this message: {error.message}
      </p>
    );
  }
  if (!email) return null;

  const initials = getInitials(email.fromName, email.fromAddress);

  return (
    <div id="my-mail-renderer" className="doc-mail-renderer">
      <div className="doc-mail-header">
        <div className="doc-mail-avatar">{initials}</div>

        <div className="doc-mail-sender-block">
          <div className="doc-mail-sender-row">
            <span className="doc-mail-sender-name">
              {email.fromName || email.fromAddress}
            </span>
          </div>

          <RecipientRow label="To" list={email.to} />
          <RecipientRow label="Cc" list={email.cc} />
        </div>

        {email.date && (
          <div className="doc-mail-date">{email.date.toLocaleString()}</div>
        )}
      </div>

      <iframe
        srcDoc={srcDoc}
        title="Mail Preview"
        sandbox="allow-same-origin"
        className="doc-mail-frame"
      />

      {email.attachments.length > 0 && (
        <div className="doc-mail-attachments">
          <div className="doc-mail-attachments-label">
            Attachments ({email.attachments.length})
          </div>
          <div className="doc-mail-attachment-list">
            {email.attachments.map((att, i) => (
              <a
                key={`${att.filename}-${i}`}
                href={att.url}
                download={att.filename}
                className="doc-mail-attachment-chip"
                title={`Download ${att.filename}`}
              >
                <DownloadOutlinedIcon className="doc-mail-attachment-icon" />
                <span className="doc-mail-attachment-name">{att.filename}</span>
                <span className="doc-mail-attachment-size">{formatBytes(att.size)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

CustomMailViewer.fileTypes = [...EML_TYPES, ...MSG_TYPES];
CustomMailViewer.weight = 1;

export default CustomMailViewer;
