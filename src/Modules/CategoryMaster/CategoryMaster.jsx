import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Shield,
  Search,
  Loader2,
} from "lucide-react";
import "./CategoryMaster.css";
import {
  getAllCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  addEntitlement as apiAddEntitlement,
  updateEntitlement as apiUpdateEntitlement,
  deleteEntitlement as apiDeleteEntitlement,
  toggleEntitlement as apiToggleEntitlement,
} from "./CategoryInfoApi";
import Toast from "../Assignee/Toast";
import { showToast } from "../Assignee/toastService";
// ---------------------------------------------------------------------------
// Category Master — manage Categories and the Entitlements attached to each.
// Data model (used directly, matches the API shape — no mapping layer):
//   Category    -> { categoryId, categoryName, description, active, entitlements: Entitlement[] }
//   Entitlement -> { entitlementId, entitlement, description, enabled }
// ---------------------------------------------------------------------------

const emptyCategory = { categoryName: "", description: "", active: true };
const emptyEntitlement = { entitlement: "", description: "", enabled: true };

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Toggle({ checked, onChange, title, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      onClick={onChange}
      disabled={disabled}
      className={`toggle ${checked ? "toggle-on" : ""}`}
    >
      <span className="toggle-knob" />
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, required }) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {required && <span className="field-required">*</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </label>
  );
}

export default function CategoryMaster() {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [catModal, setCatModal] = useState(null); // { mode, id?, data }
  const [entModal, setEntModal] = useState(null); // { mode, categoryId, id?, data }
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, categoryId, entId?, label }
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null); // entitlement id currently mid-toggle

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCategories();
      // Use the API response as-is; just guard against a missing entitlements array.
      const normalized = data.map((c) => ({
        ...c,
        entitlements: c.entitlements || [],
      }));
      setCategories(normalized);
      setExpanded((prev) =>
        prev.size === 0 && normalized[0]
          ? new Set([normalized[0].categoryId])
          : prev,
      );
    } catch (err) {
      setError("Unable to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = categories.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.categoryName.toLowerCase().includes(q) ||
      c.entitlements.some((e) => e.entitlement.toLowerCase().includes(q))
    );
  });

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ---- Category CRUD ----
  function openAddCategory() {
    setCatModal({ mode: "add", data: { ...emptyCategory } });
  }
  function openEditCategory(cat) {
    setCatModal({
      mode: "edit",
      id: cat.categoryId,
      data: {
        categoryName: cat.categoryName,
        description: cat.description,
        active: cat.active,
      },
    });
  }
  async function saveCategory() {
    const { mode, id, data } = catModal;
    if (!data.categoryName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        categoryName: data.categoryName.trim(),
        active: data.active,
        description: data.description,
      };
      if (mode === "add") {
        payload.categoryId=generateId('category')
        await apiCreateCategory(payload);
        showToast("success", "Success", "Category created successfully");
        
      } else {
        await apiUpdateCategory(id, payload);
        showToast("success", "Success", "Category created successfully");
        
      }
      await fetchCategories();
      setCatModal(null);
    } catch (err) {
      setError(
        mode === "add"
          ? "Unable to add category."
          : "Unable to update category.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteCategory(id) {
    setSaving(true);
    try {
      await apiDeleteCategory(id);
      await fetchCategories();
      showToast("success", "Success", "Category deleted successfully");
        
    } catch (err) {
      setError("Unable to delete category.");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }

  // ---- Entitlement CRUD ----
  function openAddEntitlement(categoryId) {
    setEntModal({ mode: "add", categoryId, data: { ...emptyEntitlement } });
  }
  function openEditEntitlement(categoryId, ent) {
    setEntModal({
      mode: "edit",
      categoryId,
      id: ent.entitlementId,
      data: {
        entitlement: ent.entitlement,
        description: ent.description,
        enabled: ent.enabled,
      },
    });
  }
  async function saveEntitlement() {
    const { mode, categoryId, id, data } = entModal;
    if (!data.entitlement.trim()) return;
    setSaving(true);
    try {
      const payload = {
        entitlement: data.entitlement.trim(),
        description: data.description.trim(),
        enabled: data.enabled,
      };

      if (mode === "add") {
        payload.entitlementId=generateId('entitlement')
        await apiAddEntitlement(categoryId, payload);
        showToast("success", "Success", "Entitlement added successfully");
        
      } else {
        await apiUpdateEntitlement(categoryId, id, payload);
        showToast("success", "Success", "Entitlement updated successfully");
        
      }
      await fetchCategories();
      setEntModal(null);
    } catch (err) {
      setError(
        mode === "add"
          ? "Unable to add entitlement."
          : "Unable to update entitlement.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteEntitlement(categoryId, entId) {
    setSaving(true);
    try {
      await apiDeleteEntitlement(categoryId, entId);
      await fetchCategories();
      showToast("error", "Success", "Entitlement deleted successfully");
        
    } catch (err) {
      setError("Unable to delete entitlement.");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }
  async function toggleEntitlement(categoryId, entId) {
    const category = categories.find((c) => c.categoryId === categoryId);
    const entitlement = category?.entitlements.find(
      (e) => e.entitlementId === entId,
    );
    if (!entitlement) return;

    const previousEnabled = entitlement.enabled;
    const nextEntitlement = { ...entitlement, enabled: !previousEnabled };

    // optimistic update
    setCategories((prev) =>
      prev.map((c) =>
        c.categoryId === categoryId
          ? {
              ...c,
              entitlements: c.entitlements.map((e) =>
                e.entitlementId === entId ? nextEntitlement : e,
              ),
            }
          : c,
      ),
    );
    setTogglingId(entId);
    try {
      await apiToggleEntitlement(nextEntitlement);
      showToast("success", "Success", "Entitlement toggled successfully");
        
    } catch (err) {
      // rollback on failure
      setCategories((prev) =>
        prev.map((c) =>
          c.categoryId === categoryId
            ? {
                ...c,
                entitlements: c.entitlements.map((e) =>
                  e.entitlementId === entId
                    ? { ...e, enabled: previousEnabled }
                    : e,
                ),
              }
            : c,
        ),
      );
      setError("Unable to update entitlement status.");
    } finally {
      setTogglingId(null);
    }
  }

  function generateId(type) {
      // Use native crypto.randomUUID (all modern browsers + Node 19+)
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback for older environments
      if(type==='category')
        return `C${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      else
        return `E${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

  return (
    <div className="category-master">
      <div className="cm-container">
        <div className="cm-header-row">
          <div>
            <h1 className="cm-title">Category Master</h1>
            <p className="cm-subtitle">
              Manage categories and their entitlements
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={openAddCategory}
            disabled={loading}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        {error && (
          <div className="empty-state" role="alert">
            {error}{" "}
            <button
              type="button"
              className="btn-cancel"
              onClick={fetchCategories}
              style={{ marginLeft: 8 }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories or entitlements..."
            className="search-input"
          />
        </div>

        <div className="cm-list">
          {loading && (
            <div className="empty-state">
              <Loader2 size={16} className="spin" /> Loading categories...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">No categories match your search.</div>
          )}

          {!loading &&
            filtered.map((cat) => {
              const isOpen = expanded.has(cat.categoryId);
              const enabledCount = cat.entitlements.filter(
                (e) => e.enabled,
              ).length;
              return (
                <div key={cat.categoryId} className="category-card">
                  <div className="category-header">
                    <button
                      type="button"
                      className="expand-btn"
                      onClick={() => toggleExpand(cat.categoryId)}
                      aria-label="Toggle entitlements"
                    >
                      {isOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>

                    <div className="category-info">
                      <div className="category-title-row">
                        <span className="category-name">
                          {cat.categoryName}
                        </span>
                        <Badge tone={cat.active ? "active" : "inactive"}>
                          {cat.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {cat.description && (
                        <p className="category-description">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="entitlement-count">
                      <Shield size={13} />
                      <span>
                        {enabledCount}/{cat.entitlements.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => openEditCategory(cat)}
                      aria-label="Edit category"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      onClick={() =>
                        setConfirmDelete({
                          type: "category",
                          categoryId: cat.categoryId,
                          label: cat.categoryName,
                        })
                      }
                      aria-label="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="entitlements-panel">
                      <div className="entitlements-header">
                        <span className="entitlements-label">Entitlements</span>
                        <button
                          type="button"
                          className="add-entitlement-btn"
                          onClick={() => openAddEntitlement(cat.categoryId)}
                        >
                          <Plus size={13} /> Add Entitlement
                        </button>
                      </div>

                      {cat.entitlements.length === 0 ? (
                        <p className="empty-state-small">
                          No entitlements defined for this category.
                        </p>
                      ) : (
                        <div className="entitlements-list">
                          {cat.entitlements.map((ent) => (
                            <div
                              key={ent.entitlementId}
                              className="entitlement-row"
                            >
                              <Toggle
                                checked={ent.enabled}
                                onChange={() =>
                                  toggleEntitlement(
                                    cat.categoryId,
                                    ent.entitlementId,
                                  )
                                }
                                title={ent.enabled ? "Enabled" : "Disabled"}
                                disabled={togglingId === ent.entitlementId}
                              />

                              <div className="entitlement-info">
                                <div className="entitlement-name-row">
                                  <span className="entitlement-name">
                                    {ent.entitlement}
                                  </span>
                                </div>
                                {ent.description && (
                                  <p className="entitlement-description">
                                    {ent.description}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() =>
                                  openEditEntitlement(cat.categoryId, ent)
                                }
                                aria-label="Edit entitlement"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="icon-btn icon-btn-danger"
                                onClick={() =>
                                  setConfirmDelete({
                                    type: "entitlement",
                                    categoryId: cat.categoryId,
                                    entId: ent.entitlementId,
                                    label: ent.entitlement,
                                  })
                                }
                                aria-label="Delete entitlement"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {catModal && (
        <Modal
          title={catModal.mode === "add" ? "Add Category" : "Edit Category"}
          onClose={() => !saving && setCatModal(null)}
        >
          <TextField
            label="Name"
            required
            value={catModal.data.categoryName}
            onChange={(v) =>
              setCatModal((m) => ({
                ...m,
                data: { ...m.data, categoryName: v },
              }))
            }
            placeholder="e.g. Electronics"
          />
          <TextField
            label="Description"
            value={catModal.data.description}
            onChange={(v) =>
              setCatModal((m) => ({
                ...m,
                data: { ...m.data, description: v },
              }))
            }
            placeholder="Optional"
          />
          <label className="field">
            <span className="field-label">Status</span>
            <select
              value={catModal.data.active ? "true" : "false"}
              onChange={(e) =>
                setCatModal((m) => ({
                  ...m,
                  data: {
                    ...m.data,
                    active: e.target.value === "true",
                  },
                }))
              }
              className="field-input"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setCatModal(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-save"
              onClick={saveCategory}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : catModal.mode === "add"
                  ? "Add Category"
                  : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Add/Edit Entitlement Modal */}
      {entModal && (
        <Modal
          title={
            entModal.mode === "add" ? "Add Entitlement" : "Edit Entitlement"
          }
          onClose={() => !saving && setEntModal(null)}
        >
          <TextField
            label="Name"
            required
            value={entModal.data.entitlement}
            onChange={(v) =>
              setEntModal((m) => ({
                ...m,
                data: { ...m.data, entitlement: v },
              }))
            }
            placeholder="e.g. Bulk Upload"
          />
          <TextField
            label="Description"
            value={entModal.data.description}
            onChange={(v) =>
              setEntModal((m) => ({
                ...m,
                data: { ...m.data, description: v },
              }))
            }
            placeholder="Optional"
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={entModal.data.enabled}
              onChange={(e) =>
                setEntModal((m) => ({
                  ...m,
                  data: { ...m.data, enabled: e.target.checked },
                }))
              }
              className="checkbox-input"
            />
            <span className="checkbox-label">Enabled by default</span>
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setEntModal(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-save"
              onClick={saveEntitlement}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : entModal.mode === "add"
                  ? "Add Entitlement"
                  : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Confirm Delete"
          onClose={() => !saving && setConfirmDelete(null)}
        >
          <p className="confirm-text">
            Are you sure you want to delete{" "}
            <strong>{confirmDelete.label}</strong>?
            {confirmDelete.type === "category" &&
              " This will also remove all its entitlements and mapping with users."}{" "}
            This cannot be undone.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setConfirmDelete(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-delete"
              disabled={saving}
              onClick={() =>
                confirmDelete.type === "category"
                  ? deleteCategory(confirmDelete.categoryId)
                  : deleteEntitlement(
                      confirmDelete.categoryId,
                      confirmDelete.entId,
                    )
              }
            >
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
