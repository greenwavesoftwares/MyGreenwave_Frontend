import { format, parse } from "date-fns";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import { addHolidaysAPI, getHolidaysAPI } from "./HolidayAPI";

const dateFormat = "yyyy-MM-dd";

const getHolidays = async () => {
  const data = await getHolidaysAPI();
  return data ? data : null;
};
const getRowDataForEdit = (setHolidayData, row) => {
  setHolidayData((prev) => ({
    ...prev,
    dates: [
      parse(row.fromDate, dateFormat, new Date()),
      parse(row.toDate, dateFormat, new Date()),
    ],
    holidays: row.holidays,
    isRestricted: row.type === "Restricted" ? true : false,
    restrictedUsers: row.type === "Restricted" ? row.restrictedUsers : null,
  }));
};
const getRowDataForAdd = (holidayData) => {
  let addholidayData = {};
  addholidayData.fromDate = format(holidayData.dates[0], dateFormat);
  addholidayData.toDate = format(holidayData.dates[1], dateFormat);
  addholidayData.year = addholidayData.fromDate.substring(0, 4);
  addholidayData.holidays = holidayData.holidays;
  addholidayData.type = holidayData.isRestricted ? "Restricted" : "Public";
  addholidayData.restrictedUsers = holidayData.isRestricted
    ? holidayData.restrictedUsers
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
    !editMode &&
    (!holidayData.dates[0] || !holidayData.dates[1] || !holidayData.holidays)
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
  toastRef
) => {
  if (validateHoliday(editMode, holidayData, setHolidayValidation, toastRef)) {
    let addholidayData = getRowDataForAdd(holidayData);

    const data = addHolidaysAPI(addholidayData, toastRef);
    if (data) {
      showSuccessMessage(
        toastRef,
        "Success",
        `Holiday ${editMode ? "Edited" : "Added"}  Successfully`
      );
    }
  }
};
export { getHolidays, addOrEditHoliday, getRowDataForEdit };
