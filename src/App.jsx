import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";

import PrivateRoute from "./components/PrivateRouter/PrivateRouter";
import MenuBar from "./components/MenuBar/MenuBar";
import WrappedRoutes from "./components/Routes/WrappedRoutes";
import Login from "./Modules/Login/Login";
import { getUserData } from "./Modules/Login/Encrypt";
import { useEffect } from "react";
import Restricted from "./Restricted";
import ActivityAssigner from "./Test Ground/Example";
import ActivityTrackerCharts from "./Modules/ProjectDashBoard/ActivityTrackerCharts";

function App() {
  console.log("rendering app component");
  const userData = getUserData();
  const baseRoute = import.meta.env.VITE_BASE_ROUTE;
  useEffect(() => {
    const setLastActionTime = () =>
      localStorage.setItem(
        "lastActionTime",
        Math.floor(Date.now() / 1000).toString(),
      );

    window.addEventListener("mousemove", setLastActionTime);

    return () => {
      window.removeEventListener("mousemove", setLastActionTime);
    };
  }, []);

  return (
    <Routes>
      {/* This will be only accessible for public */}
      <Route path="login" element={<Login />} />
      <Route path="ActivityAssigner" element={<ActivityAssigner />} />

      {/* Any other route will go via this  */}
      <Route element={<PrivateRoute />}>
        <Route
          index
          element={
            <Navigate
              to={`${baseRoute}/${userData?.userDetails?.espHomepage}`}
              replace
            />
          }
        />
        <Route path={`${baseRoute}`} element={<MenuBar />}>
          {WrappedRoutes()}
        </Route>
      </Route>

      {/* For wrong routing go to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      
            
    </Routes>
  );
}

export default App;
