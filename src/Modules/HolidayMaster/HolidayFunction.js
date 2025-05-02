import { getHolidaysAPI } from "./HolidayAPI";

const getHolidays = async () => {
  const data = await getHolidaysAPI();
  return data ? data : null;
};
export { getHolidays };
