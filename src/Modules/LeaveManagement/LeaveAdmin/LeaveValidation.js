const validateApplyLeave = (applyLeaveData, setApplyLeaveValidate) => {
  let success = true;
  if (!applyLeaveData.dates[0] || !applyLeaveData.dates[1]) {
    setApplyLeaveValidate((prevData) => ({
      ...prevData,
      dateValidate: false,
      dateValidateMessage: "Select Dates",
    }));
    success = false;
  } else
    setApplyLeaveValidate((prevData) => ({
      ...prevData,
      dateValidate: true,
      dateValidateMessage: "",
    }));
  if (applyLeaveData.reason.trim().length === 0) {
    setApplyLeaveValidate((prevData) => ({
      ...prevData,
      reasonValidate: false,
      reasonValidateMessage: "Enter Reason",
    }));
    success = false;
  } else
    setApplyLeaveValidate((prevData) => ({
      ...prevData,
      reasonValidate: true,
      reasonValidateMessage: "",
    }));
  return success;
};

const validateEditLeave = (editLeaveData, setEditLeaveValidate) => {
  let success = true;
  if (!editLeaveData.dates[0] || !editLeaveData.dates[1]) {
    setEditLeaveValidate((prevData) => ({
      ...prevData,
      dateValidate: false,
      dateValidateMessage: "Select Dates",
    }));
    success = false;
  } else
    setEditLeaveValidate((prevData) => ({
      ...prevData,
      dateValidate: true,
      dateValidateMessage: "",
    }));
  if (editLeaveData.reason.trim().length === 0) {
    setEditLeaveValidate((prevData) => ({
      ...prevData,
      reasonValidate: false,
      reasonValidateMessage: "Enter Reason",
    }));
    success = false;
  } else
    setEditLeaveValidate((prevData) => ({
      ...prevData,
      reasonValidate: true,
      reasonValidateMessage: "",
    }));
  return success;
};
export { validateApplyLeave, validateEditLeave };
