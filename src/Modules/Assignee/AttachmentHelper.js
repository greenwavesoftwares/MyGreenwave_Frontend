import activityTrackerApi from "../../Services/activityTrackerApi";
import { showToast } from "./toastService";

/**
 * Derives a human-readable file name from a stored attachment key.
 * Keys are stored as "<uuid>_<originalFileName>" — this strips the uuid
 * prefix off and falls back to the raw key if it doesn't match that shape.
 *
 * NOTE: adjust this if your MinIO keys follow a different naming
 * convention than the one assumed here.
 */
export function getAttachmentFileName(attachmentKey) {
  if (!attachmentKey) return "";
  const base = attachmentKey.split("/").pop();
  const underscoreIndex = base.indexOf("_");
  return underscoreIndex > -1 ? base.slice(underscoreIndex + 1) : base;
}

/**
 * Fetches an attachment from MinIO and opens it in a DocumentViewer.
 *
 * Deliberately generic — it isn't tied to any one dialog or component.
 * Any caller supplies its own `documentViewerRef` (a ref to a
 * `<DocumentViewer hideTrigger />` instance), so the same function can
 * drive attachment previews anywhere in the app, not just comments/replies.
 *
 * @param {string} attachmentKey - storage key of the attachment
 * @param {string} folder - storage folder/bucket segment (e.g. "comments", "replies")
 * @param {React.RefObject} documentViewerRef - ref to the DocumentViewer that should display it
 */
export async function viewAttachmentFromMinio(attachmentKey, folder, documentViewerRef) {
  try {
    const fileBlob = await activityTrackerApi.getMinIoFile(attachmentKey, folder);
    const filename=getAttachmentFileName(attachmentKey);
    await viewAttachment(fileBlob,documentViewerRef,filename)
  } catch (error) {
    console.error("Failed to open file", error);
    showToast("error", "Error", "Unable to preview file");
  }
}
export async function viewAttachment(fileBlob,documentViewerRef,filename){
  try {
    await documentViewerRef?.current?.openBlob(
      fileBlob,
      
    );
  } catch (error) {
    console.error("Failed to open file", error);
    showToast("error", "Error", "Unable to preview file");
  }
}

/**
 * Fetches an attachment from MinIO and downloads it straight to disk,
 * independent of any preview. Also generic/reusable — no dependency on
 * a specific dialog's state.
 *
 * @param {string} attachmentKey - storage key of the attachment
 * @param {string} folder - storage folder/bucket segment (e.g. "comments", "replies")
 */
export async function downloadAttachment(attachmentKey, folder) {
  try {
    const fileBlob = await activityTrackerApi.getMinIoFile(attachmentKey, folder);
    const fileName = getAttachmentFileName(attachmentKey);
    const url = window.URL.createObjectURL(fileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download file", error);
    showToast("error", "Error", "Unable to download file");
  }
}
