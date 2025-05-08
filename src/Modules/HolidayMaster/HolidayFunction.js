import { format, parse } from "date-fns";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import {
  addHolidaysAPI,
  editHolidaysAPI,
  getHolidayDatesAPI,
  getHolidaysAPI,
} from "./HolidayAPI";
import { getUserIdAndEmpCodes } from "../AdminPage/AdminFunction";

const dateFormat = "yyyy-MM-dd";

const getHolidays = async () => {
  const data = await getHolidaysAPI();
  return data ? data : null;
};
const getHolidayDates = async () => {
  let data = await getHolidayDatesAPI();
  if (data) {
    data = data.map((p) => parse(p, dateFormat, new Date()));
    return data;
  }
  return null;
};
const getRowDataForEdit = async (setHolidayData, row) => {
  setHolidayData((prev) => ({
    ...prev,
    holidayId: row.holidayId,
    dates: [
      parse(row.fromDate, dateFormat, new Date()),
      parse(row.toDate, dateFormat, new Date()),
    ],
    totalNoOfDays: row.totalNoOfDays,
    holidays: row.holidays,
    isRestricted: row.type === "Restricted" ? true : false,
    restrictedUsers:
      row.type === "Restricted"
        ? row.restrictedUsers.split(",").map(Number)
        : [],
  }));
  console.log(await getUserIdAndEmpCodes());
  console.log(row.restrictedUsers.split(","));
};
const getRowDataForAdd = (holidayData) => {
  let addholidayData = {};
  addholidayData.fromDate = format(holidayData.dates[0], dateFormat);
  addholidayData.toDate = format(holidayData.dates[1], dateFormat);
  addholidayData.totalNoOfDays = holidayData.totalNoOfDays;
  addholidayData.year = addholidayData.fromDate.substring(0, 4);
  addholidayData.holidays = holidayData.holidays;
  addholidayData.holidayId = holidayData.holidayId;
  addholidayData.type = holidayData.isRestricted ? "Restricted" : "Public";
  addholidayData.restrictedUsers = holidayData.isRestricted
    ? holidayData.restrictedUsers.join(",")
    : null;

  return addholidayData;
};
const validateHoliday = (
  editMode,
  holidayData,
  setHolidayValidation,
  toastRef
) => {
  if (
    (!editMode && (!holidayData.dates[0] || !holidayData.dates[1])) ||
    !holidayData.holidays
  ) {
    showErrorMessage(toastRef, "Validation Error", "Please enter all fields");
    setHolidayValidation((prev) => ({
      ...prev,
      dates: holidayData.dates[0] && holidayData.dates[1],
      holidays: holidayData.holidays,
    }));
    return false;
  }
  setHolidayValidation((prev) => ({
    ...prev,
    dates: true,
    holidays: true,
  }));
  return true;
};
const addOrEditHoliday = async (
  editMode,
  holidayData,
  setHolidayValidation,
  toastRef,
  holidayTable,
  setHolidayTable,
  setHolidayVisible
) => {
  if (validateHoliday(editMode, holidayData, setHolidayValidation, toastRef)) {
    let addholidayData = getRowDataForAdd(holidayData);

    const data = editMode
      ? await editHolidaysAPI(addholidayData, toastRef)
      : await addHolidaysAPI(addholidayData, toastRef);
    if (data) {
      editMode
        ? (holidayTable[
            holidayTable.findIndex(
              (p) => p.holidayId === addholidayData.holidayId
            )
          ] = addholidayData)
        : holidayTable.push(addholidayData);
      setHolidayTable((prev) => ({ ...prev, table: holidayTable }));
      showSuccessMessage(
        toastRef,
        "Success",
        `Holiday ${editMode ? "Edited" : "Added"}  Successfully`
      );
      setHolidayVisible(false);
    }
  }
};
export { getHolidays, addOrEditHoliday, getRowDataForEdit, getHolidayDates };
