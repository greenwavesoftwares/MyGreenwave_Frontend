// components/PrivateRoute.jsx
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { decodeJWT, getUserData } from "../../Modules/Login/Encrypt";
import usePoll from "../Poll/usePoll";
import { useEffect } from "react";
import { extendTokenExpiration } from "../../Modules/Login/LoginFunction";
const sessionTimeout = import.meta.env.VITE_SESSION_TIMEOUT;

const PrivateRoute = () => {
  const userData = getUserData();
  const navigate = useNavigate();
  const { exp: expriryTime } =
    userData && userData.userDetails && userData.token
      ? decodeJWT(userData?.token)
      : 0;
  const pollInterval = expriryTime - Math.floor(Date.now() / 1000) - 10;

  const checkForSession = () => {
    let currentTime = Math.floor(Date.now() / 1000);
    const idleTime =
      currentTime - (parseInt(localStorage.getItem("lastActionTime"), 10) || 0);

    if (idleTime < sessionTimeout) {
      extendTokenExpiration();
      return true;
    } else {
      navigate("/Login");
      return false;
    }
  };

  const pollRef = usePoll(
    checkForSession,
    pollInterval > 0 ? pollInterval : sessionTimeout
  );

  useEffect(() => {
    pollRef.start();
    pollInterval <= 1 ? checkForSession() : null;
    return () => pollRef.stop();
  }, [pollRef]);

  return userData &&
    userData.userDetails &&
    userData.token &&
    expriryTime > Math.floor(Date.now() / 1000) ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
