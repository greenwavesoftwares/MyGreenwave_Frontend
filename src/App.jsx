import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LeaveManagement from "./Modules/LeaveManagement/LeaveManagement";
import Carousel from "./components/Carousel/Carousel";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import DialogComponent from "./components/Dialog/DialogComponent";
import DropdownCheckbox from "./components/DropdownCheckbox/DropdownCheckbox";
import TravelDesk from "./Modules/TravelDesk/TravelDesk";
import SalarySlip from "./Modules/SalarySlip/Salaryslip";

function App() {
  return (
    
    <Router>
      {/* <DropdownCheckbox> </DropdownCheckbox> */}
      {/* <DialogComponent></DialogComponent> */}
      {/* <DatePicker></DatePicker> */}
      {/* <Carousel> </Carousel> */}
      <Routes>
        {/* <Route path="/" element={<LeaveManagement />} /> */}
        <Route path="LeaveManagement" element={<LeaveManagement />} />
        <Route path="TravelDesk" element={<TravelDesk />} />
        <Route path="salaryslip" element={<SalarySlip />} />
      </Routes>
    </Router>
  );
}

export default App;
