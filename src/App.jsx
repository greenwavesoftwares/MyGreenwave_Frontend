
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SideBar from "./components/SideBar";

function App() {
  

  return (
    <Router>
    <SideBar>  </SideBar>
    <Routes>
     {/* <Route path="/" element={<Home/>} /> */}
      
    </Routes>
  </Router>
  )
}

export default App
