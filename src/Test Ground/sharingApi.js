import { getUserData } from "../Modules/Login/Encrypt";

const API_BASE_URL = import.meta.env.VITE_END_POINT;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MINIO_BUCKET_NAME = "notes";
/* ─── Custom Error Class ─── */
export class ApiError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  get isNetworkError() {
    return this.code === "NETWORK_ERROR" || this.code === "TIMEOUT";
  }

  get isPermissionError() {
    return this.statusCode === 403;
  }

  get isNotFound() {
    return this.statusCode === 404;
  }

  get isServerError() {
    return this.statusCode >= 500;
  }

  get userMessage() {
    // Return user-friendly message based on error type
    if (this.isNetworkError) {
      return "Network error — please check your connection and try again.";
    }
    if (this.isPermissionError) {
      return "You don't have permission to perform this action.";
    }
    if (this.isNotFound) {
      return "The requested resource was not found.";
    }
    if (this.isServerError) {
      return "Server error — please try again in a moment.";
    }
    return this.message || "An unexpected error occurred.";
  }
}

/* ─── Get Auth Token ─── */
function getAuthToken() {
  // Replace with your actual auth mechanism
  return localStorage.getItem("authToken") || "";
}

/* ─── Core Fetch Wrapper with Timeout & Error Handling ─── */
async function apiRequest(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getUserData()?.token}`,
      ...(options.headers || {}),
    },
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const error = data?.error || {};
      throw new ApiError(
        error.message || `Request failed with status ${response.status}`,
        response.status,
        error.code || "API_ERROR",
        error,
      );
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (err.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Please try again.",
        0,
        "TIMEOUT",
      );
    }

    // Handle network errors (offline, DNS failure, etc.)
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new ApiError(
        "Network error — please check your connection.",
        0,
        "NETWORK_ERROR",
      );
    }

    // Re-throw ApiError as-is
    if (err instanceof ApiError) {
      throw err;
    }

    // Unknown error
    throw new ApiError(
      err.message || "An unknown error occurred",
      0,
      "UNKNOWN_ERROR",
    );
  }
}

/* ─── Retry Wrapper (for network errors only) ─── */
async function apiRequestWithRetry(endpoint, options = {}, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest(endpoint, options);
    } catch (err) {
      lastError = err;
      // Only retry on network errors, not on 4xx/5xx
      if (!err.isNetworkError || attempt === maxRetries) {
        throw err;
      }
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

/* ─── URL Encoding Helper ─── */
function encodeParam(value) {
  return encodeURIComponent(String(value));
}

/* ═══════════════════════════════════════════════════════
   API METHODS
   ═══════════════════════════════════════════════════════ */

/* ─── 1. GET /users — Fetch users for share modal ─── */
export async function getUsers({
  active = true,
  department = null,
  search = null,
  excludeIds = [],
  limit = null,
} = {}) {
  // Full URL for user service
  const url = `${API_BASE_URL}/admin/allusers`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getUserData()?.token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch users (${response.status})`,
        response.status,
        "USERS_FETCH_FAILED",
      );
    }

    const data = await response.json();
    const rawUsers = data?.userdata || [];

    // ── Transform to our expected format ──
    let users = rawUsers.map((u) => ({
      userId: u.userId,
      userName: u.userName,
      employeeId: u.employeeId,
      department: u.department || "",
      designation: u.designation || "",
      active: u.active !== false,
      // Keep some extras that might be useful
      phoneNumber: u.phoneNumber,
      manager: u.manager,
      groupNames: u.groupNames || [],
    }));

    // ── Apply client-side filters ──
    if (active) {
      users = users.filter((u) => u.active);
    }

    if (department) {
      users = users.filter((u) => u.department === department);
    }

    if (excludeIds && excludeIds.length > 0) {
      const excludeSet = new Set(
        excludeIds.map((id) => String(id).toLowerCase()),
      );
      users = users.filter(
        (u) => !excludeSet.has(u.userId.toLowerCase()),
      );
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.userName.toLowerCase().includes(q) ||
          u.userId.toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q) ||
          (u.designation || "").toLowerCase().includes(q),
      );
    }

    if (limit && limit > 0) {
      users = users.slice(0, limit);
    }

    // ── Build meta info ──
    const departments = [
      ...new Set(rawUsers.map((u) => u.department).filter(Boolean)),
    ].sort();

    return {
      users,
      meta: {
        total: rawUsers.length,
        filtered: users.length,
        departments,
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Please try again.",
        0,
        "TIMEOUT",
      );
    }

    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new ApiError(
        "Network error — please check your connection.",
        0,
        "NETWORK_ERROR",
      );
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      err.message || "Failed to fetch users",
      0,
      "UNKNOWN_ERROR",
    );
  }
}

/* ─── 2. GET /activityTracker/projects/{id}/updates — Fetch updates with sharing ─── */
export async function getProjectUpdates(projectId) {
  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "INVALID_ARGUMENT");
  }
  return apiRequestWithRetry(
    `/activityTracker/projects/${encodeParam(projectId)}/updates`,
  );
}

/* ─── 3. POST /share — Share category with users (full payload) ─── */
export async function shareCategory(projectId, categoryId, payload) {
  if (!projectId || !categoryId) {
    throw new ApiError(
      "Project ID and Category ID are required",
      400,
      "INVALID_ARGUMENT",
    );
  }
  if (!payload || typeof payload !== "object") {
    throw new ApiError("Payload is required", 400, "INVALID_ARGUMENT");
  }

  return apiRequest(
    `/activityTracker/projects/${encodeParam(projectId)}/categories/shares`,
    {
      method: "PUT",
      body: JSON.stringify([payload]), // Send as array for bulk support
    },
  );
}

/* ─── 4. DELETE /share/{userId} — Unshare with user ─── */
export async function unshareCategoryUser(projectId, categoryId, userId) {
  if (!projectId || !categoryId || !userId) {
    throw new ApiError(
      "Project ID, Category ID, and User ID are required",
      400,
      "INVALID_ARGUMENT",
    );
  }
  return apiRequest(
    `/projects/${encodeParam(projectId)}/updates/categories/${encodeParam(categoryId)}/share/${encodeParam(userId)}`,
    {
      method: "DELETE",
    },
  );
}

/* ─── 5. PUT /sharing — Bulk update all sharing (full payload) ─── */
export async function bulkUpdateSharing(projectId, payload) {
  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "INVALID_ARGUMENT");
  }
  if (!payload || typeof payload !== "object") {
    throw new ApiError("Payload is required", 400, "INVALID_ARGUMENT");
  }

  return apiRequest(`/activityTracker/projects/${encodeParam(projectId)}/categories/shares`, {
    method: "PUT",
    body: JSON.stringify(payload.categories || []), // Send full categories array
  });
}

/* ─── 6. GET /collaborators — Get all collaborators ─── */
export async function getCollaborators(projectId) {
  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "INVALID_ARGUMENT");
  }
  return apiRequestWithRetry(
    `/activityTracker/projects/${encodeParam(projectId)}/updates/collaborators`,
  );
}

/* ─── 7. GET /users/me/shared-updates — My accessible projects ─── */
export async function getMySharedProjects(role = "all") {
  const params = new URLSearchParams();
  if (role && role !== "all") params.set("role", role);
  return apiRequestWithRetry(
    `/users/me/shared-updates?${params.toString()}`,
  );
}

/* ─── 8. POST /notify — Send notifications (optional) ─── */
export async function notifySharing(projectId, { type, userIds, categoryIds, message }) {
  return apiRequest(`/activityTracker/projects/${encodeParam(projectId)}/updates/notify`, {
    method: "POST",
    body: JSON.stringify({ type, userIds, categoryIds, message }),
  });
}

/* ═══════════════════════════════════════════════════════
   NOTE / CATEGORY / SNAPSHOT APIs
   ═══════════════════════════════════════════════════════ */

/* ─── Create category ─── */
export async function createCategory(projectId, categoryData) {
  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "INVALID_ARGUMENT");
  }
  if (!categoryData || typeof categoryData !== "object") {
    throw new ApiError(
      "Category data is required",
      400,
      "INVALID_ARGUMENT",
    );
  }
  if (!categoryData.name || !categoryData.name.trim()) {
    throw new ApiError("Category name is required", 400, "INVALID_ARGUMENT");
  }

 return apiRequest(
    `/activityTracker/projects/category`,
    {
      method: "POST",
     body: JSON.stringify(categoryData), // ← Send full object
    },
  );
}
/* ─── Rename category ─── */
export async function renameCategory(projectId, categoryId, name, order) {
  return apiRequest(
    `/activityTracker/projects/categories/${encodeParam(categoryId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ name, order }), // ← Send both name and order
    },
  );
}

/* ─── Delete category ─── */
export async function deleteCategory(projectId, categoryId) {
  return apiRequest(
    `/activityTracker/projects/categories/${encodeParam(categoryId)}`,
    {
      method: "DELETE",
    },
  );
}

/* ─── Create snapshot ─── */
export async function createSnapshot(projectId, snapshot) {
  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "INVALID_ARGUMENT");
  }
  if (!snapshot || typeof snapshot !== "object") {
    throw new ApiError(
      "Snapshot object is required",
      400,
      "INVALID_ARGUMENT",
    );
  }

  return apiRequest(
    `/activityTracker/projects/snapshots`,
    {
      method: "POST",
      body: JSON.stringify(snapshot),
    },
  );
}

/* ─── Delete snapshot ─── */
export async function deleteSnapshot(projectId, snapshotId) {
  return apiRequest(
    `/activityTracker/projects/snapshots/${encodeParam(snapshotId)}`,
    {
      method: "DELETE",
    },
  );
}

/* ─── Create note ─── */
export async function createNote(projectId, note) {
  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "INVALID_ARGUMENT");
  }
  if (!note || typeof note !== "object") {
    throw new ApiError("Note object is required", 400, "INVALID_ARGUMENT");
  }
  if (!note.categoryId || !note.snapshotId) {
    throw new ApiError(
      "Category ID and Snapshot ID are required",
      400,
      "INVALID_ARGUMENT",
    );
  }

  return apiRequest(`/activityTracker/projects/notes`, {
    method: "POST",
    body: JSON.stringify(note),
  });
}

/* ─── Update note ─── */
/* ─── Update note (PUT) ─── */
export async function updateNote(projectId, noteId, note) {
  if (!projectId || !noteId) {
    throw new ApiError(
      "Project ID and Note ID are required",
      400,
      "INVALID_ARGUMENT",
    );
  }
  if (!note || typeof note !== "object") {
    throw new ApiError("Note object is required", 400, "INVALID_ARGUMENT");
  }

  return apiRequest(
    `/activityTracker/projects/notes/${encodeParam(noteId)}`,
    {
      method: "PUT",
      body: JSON.stringify(note),
    },
  );
}
/* ─── Delete note ─── */
export async function deleteNote(projectId, noteId) {
  return apiRequest(
    `/activityTracker/projects/${encodeParam(projectId)}/updates/notes/${encodeParam(noteId)}`,
    {
      method: "DELETE",
    },
  );
}


/* ─── Load template (bulk create categories) ─── */
export async function loadTemplate(projectId, categories) {

  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "INVALID_ARGUMENT");
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new ApiError(
      "Categories array is required",
      400,
      "INVALID_ARGUMENT",
    );
  }
console.log("categories template : ",categories)
  return apiRequest(
    
    `/activityTracker/projects/categories`,
    {
      method: "POST",
      body: JSON.stringify( categories ),
    },
  );
}

/* ═══════════════════════════════════════════════════════
   REQUEST DEDUPLICATION (Prevents race conditions)
   ═══════════════════════════════════════════════════════ */

const pendingRequests = new Map();

/**
 * Dedupe identical concurrent requests
 * If the same request is fired twice, both callers get the same promise
 */
export function dedupedRequest(key, requestFn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, promise);
  return promise;
}

/* ═══════════════════════════════════════════════════════
   CACHE (Simple in-memory cache for user data)
   ═══════════════════════════════════════════════════════ */

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(keyPrefix = null) {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  Array.from(cache.keys())
    .filter((k) => k.startsWith(keyPrefix))
    .forEach((k) => cache.delete(k));
}

/* ─── Cached users fetch (deduped + cached) ─── */
export async function getUsersCached(options = {}) {
  const cacheKey = `users_${JSON.stringify(options)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const data = await dedupedRequest(cacheKey, () => getUsers(options));
  setCached(cacheKey, data);
  return data;
}

/* ─── Download file from MinIO ─── */
export async function downloadMinioFile(minioKey, bucketName = MINIO_BUCKET_NAME) {
  if (!minioKey) {
    throw new ApiError("MinIO key is required", 400, "INVALID_ARGUMENT");
  }

  const url = `${API_BASE_URL}/activityTracker/minIoFile?minioKey=${encodeParam(minioKey)}&bucketName=${encodeParam(bucketName)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getUserData()?.token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `Failed to download file (${response.status})`,
        response.status,
        "FILE_DOWNLOAD_FAILED",
      );
    }

    // Get file as blob
    const blob = await response.blob();
    return blob;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Download timed out", 0, "TIMEOUT");
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Download failed", 0, "UNKNOWN_ERROR");
  }
}

/* ─── Helper: Download and trigger browser save ─── */
export async function downloadAndSaveFile(minioKey, fileName, bucketName = MINIO_BUCKET_NAME) {
  const blob = await downloadMinioFile(minioKey, bucketName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}