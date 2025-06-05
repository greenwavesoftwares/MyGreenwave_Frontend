import { parse } from "date-fns";
import { getAllUsersAPI } from "./AdminAPI";
import { getAllDesignations } from "./Designation/DesignationFunction";

const avatarColors = JSON.parse(import.meta.env.VITE_AVATAR_COLORS);

const onPageLoad = async () => {
  let adminInfo = {};
  const data = await getAllUsersAPI();
  if (data) {
    data.userdata.forEach((user) => {
      user.initial = getInitial(user.userName);
      user.dojDate = user.doj
        ? parse(user.doj, "yyyy-MM-dd", new Date())
        : null;
      user.dobDate = user.dob
        ? parse(user.dob, "yyyy-MM-dd", new Date())
        : null;
    });
    adminInfo = data;
    adminInfo.userCount = {};
    adminInfo.userCount.active = data.userdata.filter(
      (user) => user.active
    ).length;
    adminInfo.userCount.inActive = data.userdata.filter(
      (user) => !user.active
    ).length;
    adminInfo.designations = await getAllDesignations();
  }
  return adminInfo;
};
const getInitial = (userName) => {
  if (!userName) return "";
  return {
    initialName: userName
      .split(" ")
      .filter((word) => word.length > 0)
      .map((word) => word[0].toUpperCase())
      .join(""),
    initialColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
  };
};
const getUserIdAndEmpCodes = async () => {
  const data = await getAllUsersAPI();
  return data
    ? data.userdata
        .filter((p) => p.active)
        .map((p) => ({
          userName: `${p.userName} (${p.employeeId})`,
          empCode: p.employeeId,
        }))
    : [];
};
const getUserIdAndName = async () => {
  const data = await getAllUsersAPI();
  return data
    ? data.userdata
        .filter((p) => p.active)
        .map((p) => ({
          userId: p.userId,
          userName: p.userName,
        }))
    : [];
};

export { onPageLoad, getInitial, getUserIdAndEmpCodes, getUserIdAndName };
