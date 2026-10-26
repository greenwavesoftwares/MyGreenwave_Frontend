/**
 * Local (browser-only) storage for project documentation.
 *
 * TEMPORARY: stands in for a backend until the documents API exists.
 * Files and metadata are kept in IndexedDB (localStorage is far too small
 * for files — ~5 MB total and string-only). Data therefore lives only in
 * THIS browser profile: it is not shared with other users or devices, and
 * clearing site data removes it.
 *
 * When the real API is ready, swap the five exported functions for API
 * calls that return the same record shape and nothing else needs to change.
 *
 * Record shape:
 *   { id, projectId, fileName, size, type, description,
 *     createdById, createdByName, createdAt,
 *     updatedById, updatedByName, updatedAt, blob }
 */

const DB_NAME = "pai-project-documents";
const DB_VERSION = 1;
const STORE = "documents";

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Runs `fn(store)` in a transaction and resolves with the request result
// once the transaction has fully committed.
async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(request?.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("Transaction aborted"));
    };
  });
}

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export async function listProjectDocuments(projectId) {
  const rows =
    (await withStore("readonly", (s) => s.index("projectId").getAll(projectId))) ??
    [];
  return rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function addProjectDocument(projectId, { file, description, user }) {
  const record = {
    id: newId(),
    projectId,
    fileName: file.name,
    size: file.size,
    type: file.type || "",
    description: (description ?? "").trim(),
    createdById: user?.id ?? "",
    createdByName: user?.name ?? user?.id ?? "",
    createdAt: new Date().toISOString(),
    updatedById: null,
    updatedByName: null,
    updatedAt: null,
    blob: file,
  };
  await withStore("readwrite", (s) => s.add(record));
  return record;
}

// Edit the description and/or replace the file. `createdBy*` is never
// touched — the original creator stays the owner (used by the delete rule).
export async function updateProjectDocument(id, { file, description, user }) {
  const existing = await withStore("readonly", (s) => s.get(id));
  if (!existing) throw new Error("Document not found");

  const updated = {
    ...existing,
    description: (description ?? existing.description ?? "").trim(),
    updatedById: user?.id ?? "",
    updatedByName: user?.name ?? user?.id ?? "",
    updatedAt: new Date().toISOString(),
  };
  if (file) {
    updated.fileName = file.name;
    updated.size = file.size;
    updated.type = file.type || "";
    updated.blob = file;
  }
  await withStore("readwrite", (s) => s.put(updated));
  return updated;
}

export async function deleteProjectDocument(id) {
  await withStore("readwrite", (s) => s.delete(id));
}
