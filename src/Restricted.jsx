import React from "react";

function Restricted() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-10 text-center max-w-md w-[90%] animate-fade-in">

        {/* Icon */}
        <div className="text-5xl mb-4">🚫</div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-white mb-3">
          Access Restricted
        </h1>

        {/* Message */}
        <p className="text-slate-300 leading-relaxed mb-8">
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
