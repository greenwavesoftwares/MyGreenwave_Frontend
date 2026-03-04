import ScanQRCode from "./components/ScanQRCode";
import UnderDevelopment from "./components/UnderDevelopment";
import { TabPanel, TabView } from "primereact/tabview";
import TodayMeal from "./MealBookedHistory/TodayMeal";
import QrCodeIcon from "@mui/icons-material/QrCode";
//Dummy Mel Book Data
import dummyDataAPICall from "./MealBookedHistory/dummyData";
import { useEffect, useState } from "react";
import CookMealSkeleton from "./components/CookMealSkeleton";
import { Skeleton } from "primereact/skeleton";

function CookMealVerification() {
  const [todayMealBooked, setTodayMealBooked] = useState([]);
  const [tomorrowMealBooked, setTomorrowMealBooked] = useState([]);
  const [loader, setLoader] = useState(false);
  const [scanSuccessfullyDone, setScanSuccessfullyDone] = useState(false);
  //API Call for today and tomorrow meal book table
  async function fetchMealBooking() {
    try {
      //Set Loader
      setLoader(true);
      const response = await dummyDataAPICall();
      setTodayMealBooked(response[0].today);
      setTomorrowMealBooked(response[1].tomorrow);
      console.log("Dummy_api_call_response", response);
    } catch (error) {
      console.log("Failed to fetch meal data", error);
    } finally {
      setLoader(false);
    }
  }

  useEffect(() => {
    fetchMealBooking();
  }, []);

  useEffect(() => {
    if (scanSuccessfullyDone) {
      // 🔹 After QR scan
      fetchMealBooking();
      setScanSuccessfullyDone(false);
    }
  }, [scanSuccessfullyDone]);

  console.log("scanSuccessfullyDone", scanSuccessfullyDone, "loader", loader);
  console.log("tomorrowMealBooked", tomorrowMealBooked);
  return (
    <>
      <>
        <UnderDevelopment />
        <div className="container mx-auto px-4">
          <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
            <div className=" mt-4 py-2 px-3">
              <div className="cardStyle mb-1 py-2.5 px-4 bg-white shadow rounded">
                <div className="flex items-center gap-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg blue-icon">
                        <QrCodeIcon />
                      </div>
                      <div>
                        <h1 className="text-1xl font-bold text-gray-900">
                          Cook Meal Verification
                        </h1>
                        <p
                          className=" titleTextStyle"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Scan QR & Verify Employee Meals
                        </p>
                      </div>
                    </div>

                    {/* Scan QR Code */}
                    {loader ? (
                      <Skeleton width="135px" height="38px" />
                    ) : (
                      <ScanQRCode
                        setScanSuccessfullyDone={setScanSuccessfullyDone}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {/* Tab Section for toady and tomorrow meal book table */}
                {loader ? (
                  <CookMealSkeleton />
                ) : (
                  <TabView className="mealAppTabView">
                    <TabPanel
                      header={`Today Lunch (${todayMealBooked?.length || 0})`}
                    >
                      <TodayMeal
                        loader={loader}
                        todayMealBooked={todayMealBooked}
                      />
                    </TabPanel>
                    <TabPanel
                      header={`Tomorrow Lunch (${tomorrowMealBooked?.length || 0})`}
                    >
                      <TodayMeal
                        loader={loader}
                        todayMealBooked={tomorrowMealBooked}
                      />
                    </TabPanel>
                  </TabView>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
      {/* )} */}
    </>
  );
}

export default CookMealVerification;
