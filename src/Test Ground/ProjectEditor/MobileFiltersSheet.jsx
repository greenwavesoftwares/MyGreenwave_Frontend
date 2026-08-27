import React from "react";
import { X, Check, Filter, Search } from "lucide-react"; // ← removed Zap
import BottomSheet from "../shared/BottomSheet";
import { useTheme } from "../useTheme";
import { makeInputStyle } from "../helpers/styles";

/**
 * Bottom sheet containing all mobile-only activity table controls:
 *   - Module filter (multi-select)
 *   - Task filter (text)
 *   - Resource filter (multi-select)
 *   - Status filter (multi-select)
 *   - "Add Custom Column" button
 *
 * NOTE: Auto Calculate toggle removed — replaced by per-row anchor (⚓)
 */
export default function MobileFiltersSheet({
  open,
  onClose,
  filterOptions,
  columnFilters,
  onChangeColumnFilter,
  onClearAllFilters,
  // ── REMOVED: autoCalculate, onToggleAutoCalculate ──
  onAddColumn,
  canAddColumn,
  hasActiveFilters,
  customColumns = [],
}) {
  const { t } = useTheme();
  const inputStyle = makeInputStyle(t);

  const sectionStyle = {
    padding: "14px 16px",
    borderBottom: `1px solid ${t.borderSubtle}`,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: t.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const chipStyle = (
    active,
    color = t.primary,
    bg = t.primaryBgSubtle,
    border = t.primaryBorder,
  ) => ({
    padding: "8px 12px",
    borderRadius: 999,
    border: `1.5px solid ${active ? color : t.border}`,
    background: active ? bg : t.bgCard,
    color: active ? color : t.textSecondary,
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    fontFamily: "Sora, sans-serif",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
  });

  const toggleValue = (currentArr, val) =>
    currentArr.includes(val)
      ? currentArr.filter((v) => v !== val)
      : [...currentArr, val];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters & Options"
      height="90%"
    >
      <div>
        {/* ── Module Filter ── */}
        {filterOptions.modules.length > 0 && (
          <div style={sectionStyle}>
            <div style={labelStyle}>
              <Filter size={12} />
              Module
              {columnFilters.module.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: t.primary,
                    color: t.textInverse,
                    borderRadius: 999,
                    padding: "1px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {columnFilters.module.length} selected
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filterOptions.modules.map((mod) => {
                const active = columnFilters.module.includes(mod);
                return (
                  <button
                    key={mod}
                    onClick={() =>
                      onChangeColumnFilter(
                        "module",
                        toggleValue(columnFilters.module, mod),
                      )
                    }
                    style={chipStyle(active)}
                  >
                    {active && <Check size={11} strokeWidth={3} />}
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Task Filter (text) ── */}
        <div style={sectionStyle}>
          <div style={labelStyle}>
            <Search size={12} />
            Task Name
          </div>
          <input
            type="text"
            value={columnFilters.task}
            onChange={(e) => onChangeColumnFilter("task", e.target.value)}
            placeholder="Search by task name…"
            style={{
              ...inputStyle,
              height: 44,
              fontSize: 14,
            }}
          />
        </div>

        {/* ── Resource Filter ── */}
        {filterOptions.resourceOpts.length > 0 && (
          <div style={sectionStyle}>
            <div style={labelStyle}>
              <Filter size={12} />
              Resource
              {columnFilters.resource.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: t.primary,
                    color: t.textInverse,
                    borderRadius: 999,
                    padding: "1px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {columnFilters.resource.length} selected
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filterOptions.resourceOpts.map((opt) => {
                const active = columnFilters.resource.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      onChangeColumnFilter(
                        "resource",
                        toggleValue(columnFilters.resource, opt.value),
                      )
                    }
                    style={chipStyle(
                      active,
                      t.success,
                      t.successBgSubtle,
                      t.successBorder,
                    )}
                  >
                    {active && <Check size={11} strokeWidth={3} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Status Filter ── */}
        {filterOptions.statuses.length > 0 && (
          <div style={sectionStyle}>
            <div style={labelStyle}>
              <Filter size={12} />
              Status
              {columnFilters.status.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: t.primary,
                    color: t.textInverse,
                    borderRadius: 999,
                    padding: "1px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {columnFilters.status.length} selected
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filterOptions.statuses.map((status) => {
                const active = columnFilters.status.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() =>
                      onChangeColumnFilter(
                        "status",
                        toggleValue(columnFilters.status, status),
                      )
                    }
                    style={chipStyle(
                      active,
                      t.warning,
                      t.warningBgSubtle,
                      t.warningBorder,
                    )}
                  >
                    {active && <Check size={11} strokeWidth={3} />}
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* ── NEW: Custom Column Filters ── */}
        {customColumns.map((col) => {
          const opts = filterOptions.customOpts?.[col.id] || [];
          if (opts.length === 0) return null; // Hide if column has no values yet

          const selected = columnFilters[col.id] || [];

          return (
            <div key={col.id} style={sectionStyle}>
              <div style={labelStyle}>
                <Filter size={12} />
                {col.name}
                {selected.length > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: t.primary,
                      color: t.textInverse,
                      borderRadius: 999,
                      padding: "1px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {selected.length} selected
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {opts.map((opt) => {
                  const active = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        onChangeColumnFilter(col.id, toggleValue(selected, opt))
                      }
                      style={chipStyle(
                        active,
                        t.violet,
                        t.violetBg,
                        t.violetBorder,
                      )}
                    >
                      {active && <Check size={11} strokeWidth={3} />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* ── Add Custom Column ── */}
        {canAddColumn && (
          <div style={sectionStyle}>
            <div style={labelStyle}>Custom Columns</div>
            <button
              onClick={() => {
                onAddColumn();
                onClose();
              }}
              style={{
                width: "100%",
                height: 46,
                border: `1.5px dashed ${t.violet}`,
                background: t.violetBg,
                color: t.violet,
                borderRadius: 10,
                fontFamily: "Sora, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              ➕ Add Custom Column
            </button>
          </div>
        )}
      </div>

      {/* ── Sticky footer: Clear + Done ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          padding: "12px 16px",
          borderTop: `1px solid ${t.border}`,
          background: t.bgCard,
          display: "flex",
          gap: 8,
        }}
      >
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            style={{
              flex: 1,
              height: 44,
              border: `1px solid ${t.dangerBorder}`,
              background: t.dangerBgSubtle,
              color: t.danger,
              borderRadius: 10,
              fontFamily: "Sora, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <X size={14} /> Clear All
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            flex: 1,
            height: 44,
            border: "none",
            background: t.primary,
            color: t.textInverse,
            borderRadius: 10,
            fontFamily: "Sora, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Check size={14} /> Done
        </button>
      </div>
    </BottomSheet>
  );
}
