import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  TrendingUp,
  Utensils,
  Coffee,
  LogOut,
  Bell,
  User,
} from "lucide-react";
import {fetchDashboard} from "../api/client";
import "./ClientPage.scss";
import MealBookBarChart from "./components/MealBookBarChart";
import { TabPanel, TabView } from "primereact/tabview";
import MealBookTableForLunch from "./components/MealBookTableForLunch";
import { Toast } from "primereact/toast";
import { showErrorMessage } from "../../../components/Toast/ShowMessage";
import { getUserData } from "../../../Modules/Login/Encrypt";
import MealFeedback from "./components/MealFeedback";
import UnderDevelopment from "./components/UnderDevelopment";
import SnacksBookTable from "./components/SnacksBookTable";
import QRCodeGenerator from "./components/QRCodeGenerator";

function ClientPage() {
  const [mealBookData, setMealBookData] = useState([]);
  const [numberOfMeal, setNumberOfMeal] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [callDashboardApi, setCallDashboardApi] = useState(false);
  const [showQRCode,setShowQRCode]=useState(false)
  const [isTodayScanned,setIsTodayScanned] = useState(false);
  //For Toast
  const toastRef = useRef(null);

  //Get User Token
  const {token} =  getUserData();

  //Dashboard API Call Function
  async function dashboardApiCallFn() {
   try {
     const response = await fetchDashboard(token);
     //IMPORTANT Set Meal Book Information (Today & Tomorrow)
     setMealBookData(response[3][0] ?? null);
     //IMPORTANT Set Number of meal card section
     setNumberOfMeal(response[0][0] ?? null);
     //IMPORTANT Set Chart Data
     setChartData(response[1] ?? null);
     //IMPORTANT Set Today Scanned or Not
     setIsTodayScanned(response[0][0].today_Scanned  || false)
   } catch (error) {
      console.log("Error fetching dashboard data", error);
      showErrorMessage(toastRef, "Error", "Failed to fetch dashboard data");   
   }
  }
  useEffect(() => {
    dashboardApiCallFn();
  }, [callDashboardApi]);

  //Get Current Date
  const currentData = new Date().toISOString().split("T")[0];
  //Get Next Date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDay = nextDate.toISOString().split("T")[0];

  console.log("Call_Dashboard_Api", callDashboardApi);

  //IMPORTANT QR Code Scan Component Visibility
  function qrCodeScanVisibility() {
    const currentHours = new Date().getHours();
    //Component Visibility 12PM To 3PM
    if (currentHours >= 12 && currentHours < 18) {
      setShowQRCode(true)
    }
  }
  useEffect(() => {
    qrCodeScanVisibility();
  }, []);

  console.log("!numberOfMeal?.today_Sacnned",isTodayScanned);
  return (
    <>
    <UnderDevelopment/>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className=" mt-4 py-2 px-3">
            <div className="stats-grid-meal-app">
              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-red">
                    <Calendar className="meal-app-icon-red-text" size={20} />
                  </div>
                  <span
                    className={
                      mealBookData?.todays_meal > 0
                        ? "meal-app-badge meal-app-badge-green"
                        : "meal-app-badge meal-app-badge-red"
                    }
                  >
                    {mealBookData?.todays_meal > 0 ? "ON" : "OFF"}
                  </span>
                </div>
                <h3 className="stat-label-meal-app">Today's Lunch</h3>
                <p className="stat-value-meal-app">{currentData ?? "NA"}</p>
              </div>

              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-orange">
                    <Calendar className="meal-app-icon-orange-text" size={20} />
                  </div>
                  <span
                    className={
                      mealBookData?.tomm_Meal > 0
                        ? "meal-app-badge meal-app-badge-green"
                        : "meal-app-badge meal-app-badge-red"
                    }
                  >
                    {mealBookData?.tomm_Meal > 0 ? "ON" : "OFF"}
                  </span>
                </div>
                <h3 className="stat-label-meal-app">Tomorrow's Lunch</h3>
                <p className="stat-value-meal-app">{nextDay ?? "NA"}</p>
              </div>

              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-teal">
                    <Utensils className="meal-app-icon-teal-text" size={20} />
                  </div>
                </div>
                <h3 className="stat-label-meal-app">My Meals</h3>
                <p className="stat-value-meal-app">
                  {numberOfMeal.my_Meals ?? "NA"}
                </p>
              </div>

              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-blue">
                    <Coffee className="meal-app-icon-blue-text" size={20} />
                  </div>
                </div>
                <h3 className="stat-label-meal-app">My Snacks</h3>
                <p className="stat-value-meal-app">
                  {numberOfMeal.my_Snacks ?? "NA"}
                </p>
              </div>
            </div>

            <div className="meal-app-metrics-grid">
              <div className="meal-app-metric-card">
                <div className="meal-app-metric-header">
                  <div className="icon-wrapper-meal-app meal-app-icon-emerald">
                    <TrendingUp
                      className="meal-app-icon-emerald-text"
                      size={20}
                    />
                  </div>
                  <h3 className="meal-app-metric-title">Average Meal Cost</h3>
                </div>
                <p className="meal-app-metric-value">
                  ₹{numberOfMeal.lunch_Cost ?? "NA"}
                </p>
              </div>

              <div className="meal-app-metric-card">
                <div className="meal-app-metric-header">
                  <div className="icon-wrapper-meal-app meal-app-icon-violet">
                    <TrendingUp
                      className="meal-app-icon-violet-text"
                      size={20}
                    />
                  </div>
                  <h3 className="meal-app-metric-title">Average Snacks Cost</h3>
                </div>
                <p className="meal-app-metric-value">
                  ₹{numberOfMeal.es_Cost ?? "NA"}
                </p>
              </div>

              <div className="meal-app-metric-card meal-app-metric-card-featured">
                <div className="meal-app-metric-header">
                  <div className="icon-wrapper-meal-app meal-app-icon-white">
                    <Utensils className="meal-app-icon-white-text" size={20} />
                  </div>
                  <h3 className="meal-app-metric-title meal-app-metric-title-white">
                    Total Meals Served
                  </h3>
                </div>
                <p className="meal-app-metric-value meal-app-metric-value-white">
                  {numberOfMeal.total_Meal ?? "NA"}
                </p>
              </div>
            </div>
            {/* QRCode_Generator */}

            {showQRCode &&  !isTodayScanned && ( 
            <QRCodeGenerator mealBookData={mealBookData}/>
            )
            }
            {/* Tab Section */}
            <div className="stat-card-meal-app-tab">
              {/* <MealBookTableForLunch setCallDashboardApi={setCallDashboardApi}/> */}
              <TabView className="mealAppTabView">
                <TabPanel header="Lunch">
                 <MealBookTableForLunch setCallDashboardApi={setCallDashboardApi}/>
                </TabPanel>
                <TabPanel header="Snacks">
                  <SnacksBookTable/>
                </TabPanel>
              </TabView>
            </div>
            {/* Bar Chart */}
            <div className="stat-card-meal-app mt-4">
              <MealBookBarChart allChartData={chartData} />
            </div>
            <MealFeedback/>
          </div>
        </div>
      </div>
       <Toast ref={toastRef} />
    </>
  );
}

export default ClientPage;
