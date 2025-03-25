import React from "react";
import { Toast } from "primereact/toast";

const CustomToast = ({ ref }) => {
  return (
    <div className="card flex justify-content-center">
      <Toast ref={ref} />
    </div>
  );
};
export default CustomToast;
