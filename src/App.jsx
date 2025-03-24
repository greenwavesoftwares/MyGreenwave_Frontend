import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LeaveManagement from "./Modules/LeaveManagement/LeaveManagement";
import Carousel from "./components/Carousel/Carousel";
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'primereact/resources/primereact.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';

function App() {
  return (
    <Router>
      {/* <DatePicker></DatePicker> */}
      <Carousel> </Carousel>
      <Routes>
        {/* <Route path="/" element={<LeaveManagement />} /> */}
        <Route path="LeaveManagement" element={<LeaveManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
