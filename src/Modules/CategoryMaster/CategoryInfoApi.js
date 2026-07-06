import axios from "axios";
import { getUserData } from "../Login/Encrypt";

// ---------------------------------------------------------------------------
// Category Master API client
// Base path: /api/categories
// All request/response bodies map directly to the backend's CategoryMaster
// and CategoryEntitlement models (no separate DTOs).
// ---------------------------------------------------------------------------
const host = import.meta.env.VITE_END_POINT;

const BASE_URL = `${host}api/categories`;

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 
  Authorization: `Bearer ${getUserData()?.token}`,"Content-Type": "application/json" },
});

// ---- Category ----

/**
 * Fetch all categories with their nested entitlements.
 * GET /api/categories
 * @returns  list of CategoryMaster
 */
export async function getAllCategories() {
  return client.get("").then((res) => res.data);
}

/**
 * Fetch a single category (with entitlements) by id.
 * GET /api/categories/{categoryId}
 * @param {string} categoryId
 * @returns  CategoryMaster
 */
export async  function getCategoryById(categoryId) {
  return client.get(`/${categoryId}`).then((res) => res.data);
}

/**
 * Create a new category. categoryId is DB-generated — do not send it.
 * POST /api/categories
 * @param {{ categoryName: string, isActive: boolean }} category
 * @returns created CategoryMaster
 */
export async  function createCategory(category) {
  return client.post("", category).then((res) => res.data);
}

/**
 * Update an existing category's name/status.
 * PUT /api/categories/{categoryId}
 * @param {string} categoryId
 * @param {{ categoryName: string, isActive: boolean }} category
 * @returns updated CategoryMaster
 */
export async  function updateCategory(categoryId, category) {
  return client.put(`/${categoryId}`, category).then((res) => res.data);
}

/**
 * Delete a category and all its entitlements.
 * DELETE /api/categories/{categoryId}
 * @param {string} categoryId
 */
export async  function deleteCategory(categoryId) {
  return client.delete(`/${categoryId}`).then(() => undefined);
}

// ---- Entitlement (nested under a Category) ----

/**
 * Add a new entitlement under a category. entitlementId is DB-generated —
 * do not send it.
 * POST /api/categories/{categoryId}/entitlements
 * @param {string} categoryId
 * @param {{ entitlement: string, description: string, isEnabled?: boolean }} entitlement
 */
export async  function addEntitlement(categoryId, entitlement) {
  return client
    .post(`/${categoryId}/entitlements`, entitlement)
    .then((res) => res.data);
}

/**
 * Update an entitlement's name/description. Enabled state is NOT changed
 * here — use toggleEntitlement for that.
 * PUT /api/categories/{categoryId}/entitlements/{entitlementId}
 * @param {string} categoryId
 * @param {string} entitlementId
 * @param {{ entitlement: string, description: string }} entitlement
 * @returns updated CategoryEntitlement
 */
export async  function updateEntitlement(categoryId, entitlementId, entitlement) {
  return client
    .put(`/${categoryId}/entitlements/${entitlementId}`, entitlement)
    .then((res) => res.data);
}

/**
 * Delete a single entitlement from a category.
 * DELETE /api/categories/{categoryId}/entitlements/{entitlementId}
 * @param {string} categoryId
 * @param {string} entitlementId
 * @returns
 */
export async  function deleteEntitlement(categoryId, entitlementId) {
  return client
    .delete(`/${categoryId}/entitlements/${entitlementId}`)
    .then(() => undefined);
}

/**
 * Flip an entitlement's enabled/disabled state.
 * PATCH /api/categories/{categoryId}/entitlements/{entitlementId}/toggle
 * @param {string} categoryId
 * @param {string} entitlementId
 * @param {boolean} isEnabled
 * @returns updated CategoryEntitlement
 */
export async  function toggleEntitlement(entitlement) {
  return client
    .patch(`entitlements/toggle`, entitlement)
    .then((res) => res.data);
}

// ---------------------------------------------------------------------------
// Convenience default export, in case a single-object import is preferred:
//   import categoryApi from "./categoryApi";
//   categoryApi.getAllCategories();
// ---------------------------------------------------------------------------
const categoryApi = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addEntitlement,
  updateEntitlement,
  deleteEntitlement,
  toggleEntitlement,
};

export default categoryApi;