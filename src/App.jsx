import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";

import WrappedRoutes from "./WrappedRoutes";
import Login from "./Modules/Login/Login";

function App() {
  return (
    
    <Router>
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mygreenwave/*" element={<WrappedRoutes />} />
          
      </Routes>
    </Router>
  );
}

export default App;
