import { useRef, useState } from "react";
import Calender from "../../../components/Calender/Calender";
import "./LeaveManagerApproval.css";
import { Tooltip } from "primereact/tooltip";
import { Avatar } from "primereact/avatar";
import { OverlayPanel } from "primereact/overlaypanel";
import { AvatarGroup } from "primereact/avatargroup";
import { Chip } from "primereact/chip";

const TeamLeaveCalender = ({ teamLeaveCalender }) => {
  const [selectedTeamLeave, setSelectedTeamLeave] = useState([]);
  const overlayRef = useRef(null);
  const tooltipRef = useRef(null);

  const leaveCalenderContent = (date) => {
    const leaves = date.event.extendedProps.leaves || [];
    const visibleLeaves = leaves.slice(0, 5); // Show first 5 users
    const hiddenCount = leaves.length - visibleLeaves.length;

    // eslint-disable-next-line no-unused-vars
    const avatarContent = (
      <AvatarGroup>
        {visibleLeaves.map((user, index) => (
          <Avatar
            label={user.initialName}
            style={{
              backgroundColor: user.initialColor,
            }}
            className="text-white"
            shape="circle"
            size="large"
            key={index}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        ))}
        {hiddenCount > 0 && (
          <Avatar
            shape="circle"
            size="large"
            label={`+${hiddenCount}`}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        )}
      </AvatarGroup>
    );
    const chipContent = (
      <div className="flex flex-col">
        {visibleLeaves.map((user, index) => (
          <Chip
            className={`${user.statusColor}  pl-2 mb-1`}
            key={index}
            template={() => {
              return (
                <div className={`py-1 text-50 text-xs truncate `}>
                  {user.userName}
                </div>
              );
            }}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        ))}
        {hiddenCount > 0 && (
          <Chip
            className={`pl-2 mb-1`}
            template={() => {
              return (
                <div className={`py-1 text-50 text-xs truncate`}>
                  {`+${hiddenCount} others`}
                </div>
              );
            }}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        )}
      </div>
    );

    return chipContent;
  };
  return (
    <>
      <Tooltip ref={tooltipRef} target="#selectedEvent" mouseTrack />
      <Calender
        initialView="dayGridMonth"
        events={teamLeaveCalender}
        eventContent={leaveCalenderContent}
        eventBackgroundColor="transparent"
        eventBorderColor="transparent"
        eventTextColor="inherit"
        eventMouseEnter={(e) =>
          setSelectedTeamLeave(e.event.extendedProps.leaves)
        }
      ></Calender>
      {/* <OverlayPanel ref={overlayRef}>
        <DataTable value={selectedTeamLeave} size="small">
          <Column field="userName" header="Name" />
          <Column field="fromDate" header="Date" />
          <Column field="type" header="Type" />
          <Column field="reason" header="Reason" />
          <Column field="status" header="Status" />
        </DataTable>
      </OverlayPanel> */}
      <OverlayPanel
        ref={overlayRef}
        showCloseIcon
        onHide={() => overlayRef.current?.hide()}
        className="overlayPanelStyle"
      >
        <div className="p-2 min-w-[250px] max-h-[300px] overflow-y-auto">
          {selectedTeamLeave.map((user, index) => (
            
            <>
              <Tooltip
                target={"#leave_" + user.leaveId}
                mouseTrack
                className={user.status === "Rejected" ? "block" : "hidden"}
              >
                {/* <b>Rejected By :</b> {user.rejectedBy}
                <br />
                <b>Rejected Reason :</b> {user.rejectedReason} */}
              </Tooltip>
              <div
                key={index}
                className="p-2 border-b borderColor flex flex-col gap-1"
              >
                <div className="font-bold text-[#333] defaultFont">{user.userName}</div>
                <div className="flex flex-wrap text-[0.85rem] gap-2 defaultFont">
                  <span>
                    <strong>Date:</strong> {user.fromDate}
                  </span>
                  <span>
                    <strong>Type:</strong> {user.type}
                  </span>
                </div>
                <div className="text-[0.85rem] text-[#555] defaultFont">
                  <strong>Reason:</strong> {user.reason}
                </div>
                <div>
                  <span
                    id={"leave_" + user.leaveId}
                    className={`${user.statusColor} px-[6px] py-[2px] rounded text-xs `}
                    data-pr-position="mouse"
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            </>
          ))}
        </div>
      </OverlayPanel>
    </>
  );
};

export default TeamLeaveCalender;
