import { useState, useCallback, useRef } from "react";
import * as sharingApi from "./sharingApi";
import { findUserById } from "./updatesHelpers";

export function useOptimisticSharing({
  projectId,
  currentUserId,
  onUpdate,
  showToast,
}) {
  const [pendingOps, setPendingOps] = useState(new Set());
  const opIdRef = useRef(0);

  const trackOperation = useCallback((label) => {
    const id = ++opIdRef.current;
    const key = `${label}_${id}`;
    setPendingOps((prev) => new Set([...prev, key]));
    return {
      complete: () =>
        setPendingOps((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        }),
    };
  }, []);

  const isOperationPending = pendingOps.size > 0;

  /* ─── Build full sharedWith payload with all user details ─── */
  const buildFullSharedWith = useCallback(
    (userIds, existingSharedWith = []) => {
      const now = new Date().toISOString();
      const existingMap = new Map(
        (existingSharedWith || []).map((s) => [
          s.userId.toLowerCase(),
          s,
        ]),
      );

      return userIds
        .map((uid) => {
          const uidLower = uid.toLowerCase();
          const existing = existingMap.get(uidLower);
          const user = findUserById(uid);

          return {
            userId: uid,
            userName: existing?.userName || user?.userName || uid,
            sharedAt: existing?.sharedAt || now,
            sharedBy: existing?.sharedBy || currentUserId,
          };
        })
        .filter(Boolean);
    },
    [currentUserId],
  );

  /* ─── Share category (with full payload) ─── */
  const shareCategory = useCallback(
    async (categoryId, userIds, currentSharedWith, categoryName = "") => {
      const op = trackOperation("share");

      // Build full sharedWith objects for optimistic update
      const optimisticSharedWith = buildFullSharedWith(
        userIds,
        currentSharedWith,
      );

      // Build the full payload to send to backend
      const fullPayload = {
        categoryId,
        categoryName,
        sharedWith: optimisticSharedWith,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserId,
        _pending: true,
      };

      // Optimistic update
      onUpdate({
        categoryId,
        sharedWith: optimisticSharedWith,
      });

      try {
        console.log("📤 Sending share payload:", fullPayload);

        const response = await sharingApi.shareCategory(
          projectId,
          categoryId,
          fullPayload,
        );

        console.log("📥 Share response:", response);

        // Handle different response shapes
        const serverSharedWith =
          response?.sharedWith ||
          response?.category?.sharedWith ||
          response?.data?.sharedWith ||
          optimisticSharedWith;

        // Update with server response
        onUpdate({
          categoryId,
          sharedWith: serverSharedWith,
        });

        showToast?.(
          "success",
          "Sharing updated",
          `Shared with ${serverSharedWith.length} user${serverSharedWith.length !== 1 ? "s" : ""}.`,
        );

        return response;
      } catch (err) {
        // Rollback
        onUpdate({
          categoryId,
          sharedWith: currentSharedWith || [],
        });
        showToast?.(
          "error",
          "Sharing failed",
          err.userMessage || err.message,
        );
        throw err;
      } finally {
        op.complete();
      }
    },
    [projectId, currentUserId, onUpdate, showToast, trackOperation, buildFullSharedWith],
  );

  /* ─── Unshare single user ─── */
  const unshareUser = useCallback(
    async (categoryId, userId, currentSharedWith) => {
      const op = trackOperation("unshare");
      const optimisticSharedWith = (currentSharedWith || []).filter(
        (s) => s.userId.toLowerCase() !== userId.toLowerCase(),
      );

      onUpdate({ categoryId, sharedWith: optimisticSharedWith });

      try {
        await sharingApi.unshareCategoryUser(projectId, categoryId, userId);
        showToast?.("success", "User removed", "Access revoked.");
      } catch (err) {
        onUpdate({
          categoryId,
          sharedWith: currentSharedWith || [],
        });
        showToast?.(
          "error",
          "Failed to remove user",
          err.userMessage || err.message,
        );
        throw err;
      } finally {
        op.complete();
      }
    },
    [projectId, onUpdate, showToast, trackOperation],
  );

  /* ─── Bulk update sharing (with full payload) ─── */
  const bulkUpdate = useCallback(
    async (categorySharing, previousCategories) => {
      const op = trackOperation("bulk");
      const now = new Date().toISOString();

      // Build full payload with complete category objects
      const fullCategoryUpdates = Object.entries(categorySharing).map(
        ([catId, userIds]) => {
          const prevCat = previousCategories?.find((c) => c.id === catId);
          const fullSharedWith = buildFullSharedWith(
            userIds,
            prevCat?.sharedWith || [],
          );

          return {
            categoryId: catId,
            categoryName: prevCat?.name || "",
            sharedWith: fullSharedWith,
            updatedAt: now,
            updatedBy: currentUserId,
          };
        },
      );

      const fullPayload = {
        projectId,
        updatedBy: currentUserId,
        updatedAt: now,
        categories: fullCategoryUpdates,
        _pending: true,
      };

      // Optimistic updates
      fullCategoryUpdates.forEach((upd) => {
        onUpdate({
          categoryId: upd.categoryId,
          sharedWith: upd.sharedWith,
        });
      });

      try {
        console.log("📤 Sending bulk share payload:", fullPayload);

        const response = await sharingApi.bulkUpdateSharing(
          projectId,
          fullPayload,
        );

        console.log("📥 Bulk share response:", response);

        // Handle different response shapes
        const updatedCategories =
          response?.updated ||
          response?.categories ||
          response?.data ||
          fullCategoryUpdates;

        // Update with server responses
        updatedCategories.forEach((upd) => {
          onUpdate({
            categoryId: upd.categoryId || upd.id,
            sharedWith: upd.sharedWith || [],
          });
        });

        const summary = response?.summary || {
          categoriesModified: updatedCategories.length,
        };

        showToast?.(
          "success",
          "Sharing updated",
          `${summary.categoriesModified} categor${summary.categoriesModified !== 1 ? "ies" : "y"} updated.`,
        );

        return response;
      } catch (err) {
        // Rollback all
        if (previousCategories) {
          previousCategories.forEach((cat) => {
            onUpdate({
              categoryId: cat.id,
              sharedWith: cat.sharedWith || [],
            });
          });
        }
        showToast?.(
          "error",
          "Bulk update failed",
          err.userMessage || err.message,
        );
        throw err;
      } finally {
        op.complete();
      }
    },
    [projectId, currentUserId, onUpdate, showToast, trackOperation, buildFullSharedWith],
  );

  return {
    shareCategory,
    unshareUser,
    bulkUpdate,
    isOperationPending,
    pendingOpsCount: pendingOps.size,
  };
}