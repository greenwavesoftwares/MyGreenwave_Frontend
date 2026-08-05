import React from "react";

/**
 * Multi-select dropdown picker component
 */
function MultiSelectPicker({
  t,
  pickerRef,
  open,
  setOpen,
  disabled,
  summary,
  allLabel,
  allSelected,
  onSelectAll,
  options,
  selected,
  onToggle,
  dropdownStyle
}) {
  
  return (
    <div ref={pickerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        style={{ 
          ...dropdownStyle, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          gap: 8, 
          cursor: "pointer" 
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        <span style={{ fontSize: 9, color: t.textMuted }}>{"▼"}</span>
      </button>
      
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 40,
            background: t.pickerBg,
            border: `1px solid ${t.pickerBorder}`,
            borderRadius: 10,
            boxShadow: t.pickerShadow,
            minWidth: 220,
            maxHeight: 260,
            overflowY: "auto",
            padding: 6,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: t.pickerText,
              fontWeight: 600,
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
              borderBottom: `1px solid ${t.pickerDivider}`,
              marginBottom: 2,
            }}
          >
            <input type="checkbox" checked={allSelected} onChange={onSelectAll}/> {allLabel}
          </label>
          
          {options.map((name) => (
            <label
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: t.pickerText,
                padding: "6px 8px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={selected.includes(name)} onChange={() => onToggle(name)}/> {name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectPicker;
