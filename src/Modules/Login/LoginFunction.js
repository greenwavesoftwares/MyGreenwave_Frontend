import { Navigate } from "react-router-dom";
import { setUserData } from "./Encrypt";
import {
  extendTokenExpirationAPI,
  loginCheckAPI,
  getUserDetailsAPI,
} from "./LoginAPI";

const checkCredential = async (credential, toastRef, showWPDialog) => {
  let success = false;
  const userData = { token: "", userDetails: {} };
  let data = await loginCheckAPI(credential, toastRef, showWPDialog);
  if (data != null) {
    userData.token = data.jwt;
    userData.userDetails = await getUserDetails(data.jwt);
    if (userData.userDetails != null) {
      setUserData(userData);
      success = true;
    } else {
      success = false;
    }
  } else {
    success = false;
  }
  return success;
};

const getUserDetails = async (token) => {
  const userDetails = await getUserDetailsAPI(token);
  return userDetails;
};
const extendTokenExpiration = async () => {
  let success = false;
  const userData = { token: "", userDetails: {} };
  const data = await extendTokenExpirationAPI();
  if (data != null) {
    userData.token = data;
    userData.userDetails = await getUserDetails(data);
    if (userData.userDetails != null) {
      setUserData(userData);
      success = true;
    } else {
      success = false;
    }
  } else {
    success = false;
  }
  return success;
};
export { checkCredential, extendTokenExpiration };
