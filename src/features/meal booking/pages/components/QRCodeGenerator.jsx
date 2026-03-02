import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { QRCodeCanvas } from "qrcode.react";
import GW_Logo from "../../../../assets/Images/GreenwaveLogo.png";
import { getUserData } from "../../../../Modules/Login/Encrypt";
import CryptoJS from "crypto-js";
import { Tag } from "primereact/tag";
import { Fab } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

export default function QRCodeGenerator({ mealBookData }) {
  const [visible, setVisible] = useState(false);
  //User Meat Data
  const { userDetails } = getUserData();
  const isMealBooked = mealBookData?.todays_meal; //todays_meal || tomm_Meal
  const secretKey = "my_super_secret_key";

  //NOTE QR Value
  const qrValue = {
   //date: "2026-03-01",
   //Current Date (YYYY-MM-DD)
    date: new Date().toISOString().split("T")[0],
    userId: userDetails?.employeeId,
    mealOn: isMealBooked,
  };

  //Encrypt QR Value
  const encryptQRValue = CryptoJS.AES.encrypt(
    JSON.stringify(qrValue),
    secretKey,
  ).toString();

  console.log("qrValue", qrValue);

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
        header="Meal Booking QR Code"
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
          <div className="text-center">
            <div className="text-md font-semibold">
              {userDetails?.userName || "NA"} 
            </div>
            {/* <div className="text-sm text-500">
              ID: {userDetails?.employeeId}
            </div> */}
          </div>

          <div
            className="bg-white p-3 rounded-xl shadow-md"
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
