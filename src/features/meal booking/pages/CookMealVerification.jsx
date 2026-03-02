import React from "react";
import ScanQRCode from "./components/ScanQRCode";
import UnderDevelopment from "./components/UnderDevelopment";

function CookMealVerification() {
  return (
    <>
      <UnderDevelopment />
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className=" mt-4 py-2 px-3">
            <h1>CookMealVerification</h1>
            {/* Scan QR Code */}
            <ScanQRCode />
          </div>
        </div>
      </div>
    </>
  );
}

export default CookMealVerification;
