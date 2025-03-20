import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SideBar from "./components/SideBar";
import LeaveManagement from "./Modules/LeaveManagement/LeaveManagement";

function App() {
  return (
    <Router>
      <SideBar> </SideBar>

      <Routes>
        {/* <Route path="/" element={<Home/>} /> */}
        <Route path="LeaveManagement" element={<LeaveManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
