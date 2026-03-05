import { useEffect, useState } from "react";
import { fetchAdminDashboard } from "../api/admin";
import {
  Calendar,
  TrendingUp,
  Utensils,
  Coffee,
  LogOut,
  Bell,
  User,
} from "lucide-react";
import MealBookBarChart from "./components/MealBookBarChart";
import AdminExpenseTable from "./components/AdminExpenseTable";
import { getUserData } from "../../../Modules/Login/Encrypt";
import GetExpenseSummaryDialog from "./components/getExpenseSummaryDialog";
import UnderDevelopment from "./components/UnderDevelopment";
import ScanQRCode from "./components/ScanQRCode";

function MealAdminPage() {
  //const [adminDashboardData, setAdminDashboardData] = useState(null);
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const { token } = getUserData();
  //Admin Dashboard API Call
  async function adminDashboard() {
    try {
      const response = await fetchAdminDashboard(token);
      //Set Chart Data
      setChartData(response.currentMonthMeal);
      //Set top 4 card data
      setData(response.summary[0]);
    } catch (error) {
      console.log(error);
    }
  }
  //Use Effect to call admin dashboard api
  useEffect(() => {
    adminDashboard();
  }, []);

  //Get Current Date
  const currentData = new Date().toISOString().split("T")[0];
  //Get Next Date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDay = nextDate.toISOString().split("T")[0];
  console.log("Admin_Dashboard_data", data);

  return (
    <>
    <UnderDevelopment/>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className=" mt-4">
            <div className="stats-grid-meal-app">
              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-teal">
                    <Utensils className="meal-app-icon-teal-text" size={20} />
                  </div>
                </div>
                <h3 className="stat-label-meal-app">
                  Todays Lunch ({currentData ?? "NA"})
                </h3>
                <p className="stat-value-meal-app">
                  {data.todayLunch ?? "NA"}
                </p>
              </div>

              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-orange">
                    <Calendar className="meal-app-icon-orange-text" size={20} />
                  </div>
                </div>
                <h3 className="stat-label-meal-app">
                  Tomorrow's Lunch ({nextDay ?? "NA"})
                </h3>
                <p className="stat-value-meal-app">{data.tomLunch ?? "NA"}</p>
              </div>

              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-red">
                    <Calendar className="meal-app-icon-red-text" size={20} />
                  </div>
                </div>
                <h3 className="stat-label-meal-app">Yesterday Lunch</h3>
                <p className="stat-value-meal-app">{data.yestLunch ?? "NA"}</p>
              </div>

              <div className="stat-card-meal-app">
                <div className="stat-header-meal-app">
                  <div className="icon-wrapper-meal-app meal-app-icon-blue">
                    <Coffee className="meal-app-icon-blue-text" size={20} />
                  </div>
                </div>
                <h3 className="stat-label-meal-app">Todays Snacks</h3>
                <p className="stat-value-meal-app">{data.todayEs ?? "NA"}</p>
              </div>
            </div>

            {/* Detailed Statistics Card */}
            <div className="meal-app-metric-card-admin">
              <h1 className="mb-2 ml-1">Detailed Statistics</h1>

              <div className="grid">
                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">Lunch Expense</span>
                    <span className="font-semibold text-gray-900">
                      {data.lunchExpense ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">
                      Lunch (this month)
                    </span>
                    <span className="font-semibold text-gray-900">
                      {data.totalMeal ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">Cost / Lunch</span>
                    <span className="font-semibold text-gray-900">
                      {data.lunchCost ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">
                      Snacks Expense
                    </span>
                    <span className="font-semibold text-gray-900">
                      {data.snacksExpense ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">
                      Snacks (this month)
                    </span>
                    <span className="font-semibold text-gray-900">
                      {data.totalSnacks ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">Cost / Snacks</span>
                    <span className="font-semibold text-gray-900">
                      {data.esCost ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">
                      Last Lunch Charge
                    </span>
                    <span className="font-semibold text-gray-900">
                      {data.lastMonthLunchCharge ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">
                      Last Snacks Charge
                    </span>
                    <span className="font-semibold text-gray-900">
                      {data.lastMonthEsCharge ?? "NA"}
                    </span>
                  </div>
                </div>

                <div className="col-12 lg:col-4">
                  <div className="flex align-items-center justify-content-between p-3 admin-card-bg border-round-lg">
                    <span className="text-sm text-gray-600">All Expense</span>
                    <span className="font-semibold text-gray-900">
                      {data.allExpense ?? "NA"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Table Component  */}
            <div className="stat-card-meal-app-admin mt-4">
              <AdminExpenseTable />
            </div>

            <div className="stat-card-meal-app mt-4">
              <MealBookBarChart allChartData={chartData} />
            </div>

            <GetExpenseSummaryDialog/>
          </div>
        </div>
      </div>      
    </>
  );
}

export default MealAdminPage;
