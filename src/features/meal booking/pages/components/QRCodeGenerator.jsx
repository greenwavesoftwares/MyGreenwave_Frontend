import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { QRCodeCanvas } from "qrcode.react";
import GW_Logo from "../../../../assets/Images/GreenwaveLogo.png";
import { getUserData } from "../../../../Modules/Login/Encrypt";
import CryptoJS from "crypto-js";
import { Tag } from "primereact/tag";
import { Fab } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { mealVerification } from "../MealBookedHistory/api/mealVerifictaion";

export default function QRCodeGenerator({ mealBookData }) {
  const [visible, setVisible] = useState(false);
  const [extraMeal, setExtraMeal] = useState(null);
  //User Meat Data
  const userDetails = getUserData();
  const isMealBooked = mealBookData?.todays_meal; //todays_meal || tomm_Meal
  const secretKey = "my_super_secret_key";

  //NOTE Fetch Meal Booking Data for today
  async function fetchMealBooking() {
    try {
      //setFetchMealBookingLoader(true);
      const response = await mealVerification(userDetails?.token);
      console.log("api_response", response.data.today);
      if (response.status === 200) {
        //Get Employee Id
        const emp_id = userDetails.userDetails.employeeId;
        //Check Employee Id is present in today meal booked data
        const isUserExists = response?.data.today.find(
          (item) => item.employeeId === emp_id,
        );
        console.log("isUserExists", isUserExists);
        //if user is not present in today meal booked data
        if (isUserExists?.extraMeal) {
          setExtraMeal(isUserExists.extraMeal);
        } else {
          setExtraMeal(0);
        }
      }
      console.log("meal_verification_api_call_response", response);
    } catch (error) {
      console.log("Failed to fetch meal data", error);
    }
    //   finally {
    //   setFetchMealBookingLoader(false);
    // }
  }

  //Call Fetch Meal Booking Data for today on component mount
  useEffect(() => {
    fetchMealBooking();
  }, []);

  //NOTE QR Value
  const qrValue = {
    //Current Date (YYYY-MM-DD)
    date: new Date().toISOString().split("T")[0],
    userId: userDetails?.userDetails?.employeeId,
    mealOn: isMealBooked,
    extraMeal: extraMeal,
  };

  //Encrypt QR Value
  const encryptQRValue = CryptoJS.AES.encrypt(
    JSON.stringify(qrValue),
    secretKey,
  ).toString();

  console.log("qrValue", qrValue, userDetails);

  return (
    <div className="card flex justify-content-center">
      <Fab
        color="primary"
        aria-label="add"
        size="small"
        onClick={() => setVisible(true)}
        sx={{
          position: "fixed",
          bottom: 34,
          right: 34,
          zIndex: 1000,
        }}
      >
        <QrCodeScannerIcon />
      </Fab>
      <Dialog
        header={
          <>
          <span>
            {userDetails?.userDetails.userName || "NA"} (
            {userDetails?.userDetails.employeeId}) (
            {new Date().toISOString().split("T")[0]})
          </span>
          </>
        } //"Meal Booking QR Code"
        visible={visible}
        style={{ width: "20rem" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
        className="dialogHeader dialogContent"
      >
        <div
          style={{
            display: "grid",
            justifyItems: "center",
          }}
        >
          {/* Employee Info */}
          {/* <div className="text-center">
            <div className="text-md font-semibold">
              {userDetails?.userName || "NA"}
            </div>
            <div className="text-sm text-500">
              ID: {userDetails?.employeeId}
            </div>
          </div> */}

          <div
            className="bg-white p-3 rounded-xl shadow-md mt-1"
            style={{
              border: "1px solid #ededed",
            }}
          >
            <QRCodeCanvas
              title="title"
              value={encryptQRValue}
              size={220}
              fgColor={isMealBooked ? "#28694B" : "#EB4C4C"}
              boostLevel
              imageSettings={{
                src: GW_Logo,
                height: 40,
                width: 40,
                excavate: true,
              }}
              crossOrigin="anonymous"
            />
          </div>
          {/* Status Tag */}
          <Tag
            value={isMealBooked ? "Meal Booked" : "Not Booked"}
            severity={isMealBooked ? "success" : "danger"}
            className="px-3 py-2 mt-2"
          />
        </div>
      </Dialog>
    </div>
  );
}
