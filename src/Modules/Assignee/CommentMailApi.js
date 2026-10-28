/**
 * Sends the e-mail for a comment / action point.
 *
 *   POST /projects/:projectId/comments/:commentId/mail
 *   body: {
 *     to: string[], cc: string[], subject: string,
 *     html: string, text: string,
 *     attachmentName?: string, attachmentBase64?: string
 *   }
 *
 * The backend should take the sender from the auth token, send a multipart
 * (html + text) mail and attach the file when attachmentBase64 is present.
 */

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function sendCommentMail(projectId, commentId, payload) {
  try {
    return (
      await api.post(
        `/projects/${projectId}/comments/${commentId}/mail`,
        payload,
      )
    ).data;
  } catch (err) {
    const error = new Error(
      err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to send mail",
    );
    error.status = err.response?.status;
    throw error;
  }
}
