import React from "react";

function Restricted() {
  return (
    <div className="min-h-screen flex items-center justify-center containerBG">
      <div className="text-center max-w-md w-[90%] animate-fade-in">
        {/* Icon */}

        <i className="pi pi-ban text-7xl mb-3 text-red-400"  />

        {/* Title */}
        <h1 className="text-3xl mt-2 font-semibold mb-3 text-red-400">
          Access Restricted
        </h1>

        {/* Message */}
        <p className=" leading-relaxed">
          You don’t have permission to view this page.
          <br />
          Please contact your administrator if you believe this is a mistake.
        </p>

        {/* Button */}
      </div>
    </div>
  );
}

export default Restricted;
