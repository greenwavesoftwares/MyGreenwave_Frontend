
const ProjectStatusTabs = ({
  ganttSelection,
  handleGanttSelectionChange,
  isDark,
}) => {
  console.log('isDark ProjectStatus : ',isDark)

  const colors = {
    containerBackground: isDark ? "#1e293b" : "#f1f5f9",
    activeBackground: isDark ? "#3b82f6" : "#2563eb",
    activeText: "#ffffff",
    inactiveText: isDark ? "#cbd5e1" : "#475569",
    hoverBackground: isDark ? "#334155" : "#e2e8f0",
    focusRing: isDark ? "#93c5fd" : "#1d4ed8",
  };

  const getTabStyle = (status) => {
    const isActive = ganttSelection === status;

    return {
      padding: "10px 18px",
      border: "none",
      borderRadius: "6px",
      backgroundColor: isActive
        ? colors.activeBackground
        : "transparent",
      color: isActive ? colors.activeText : colors.inactiveText,
      fontFamily: "inherit",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s ease, color 0.2s ease",
      outlineColor: colors.focusRing,
      whiteSpace: "nowrap",
    };
  };

  const getHoverHandlers = (status) => ({
    onMouseEnter: (event) => {
      if (ganttSelection !== status) {
        event.currentTarget.style.backgroundColor = colors.hoverBackground;
      }
    },
    onMouseLeave: (event) => {
      if (ganttSelection !== status) {
        event.currentTarget.style.backgroundColor = "transparent";
      }
    },
  });

  return (
    <div
      role="tablist"
      aria-label="Project status"
      style={{
        display: "inline-flex",
        gap: "4px",
        padding: "4px",
        maxWidth: "100%",
        overflowX: "auto",
        backgroundColor: colors.containerBackground,
        borderRadius: "8px",
        transition: "background-color 0.2s ease",
      }}
    >
      <button
        type="button"
        role="tab"
        aria-selected={ganttSelection === "open"}
        style={getTabStyle("open")}
        onClick={() => handleGanttSelectionChange("open")}
        {...getHoverHandlers("open")}
      >
        Open Projects
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={ganttSelection === "closed"}
        style={getTabStyle("closed")}
        onClick={() => handleGanttSelectionChange("closed")}
        {...getHoverHandlers("closed")}
      >
        Closed Projects
      </button>
    </div>
  );
};

export default ProjectStatusTabs;