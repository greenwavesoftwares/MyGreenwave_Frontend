import ScanQRCode from "./components/ScanQRCode";
import UnderDevelopment from "./components/UnderDevelopment";
import { TabPanel, TabView } from "primereact/tabview";
import TodayMeal from "./MealBookedHistory/TodayMeal";
import QrCodeIcon from "@mui/icons-material/QrCode";

function CookMealVerification() {
  return (
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
                </div>
              </div>
            </div>
            {/* Scan QR Code */}

            <div className="cardStyle mt-4 mb-2 py-2.5 px-4 bg-white shadow rounded">
              <div className="flex align-items-center gap-2 mb-3">
                <i className="pi pi-camera text-primary"></i>
                <span className="font-medium text-800">Scan QR Code</span>
              </div>
              <div className="flex align-items-center justify-center py-2">
                <ScanQRCode />
              </div>
            </div>

            <TabView className="mealAppTabView">
              <TabPanel header="Today Lunch">
                <TodayMeal />
              </TabPanel>
              <TabPanel header="Tomorrow Lunch">
                <h1>Upcoming meal data will appear here.</h1>
              </TabPanel>
            </TabView>
          </div>
        </div>
      </div>
    </>
  );
}

export default CookMealVerification;
