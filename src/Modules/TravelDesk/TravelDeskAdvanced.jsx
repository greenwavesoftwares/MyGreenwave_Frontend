import React from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
//MY Form Component Call
import MyForm from "./MyForms";
import OpenTravelsTable from "./OpenTravelsTable";

const TravelDeskAdvanced = () => {
  return (
    <>
      <div>hi</div>
      <div>
        <OpenTravelsTable></OpenTravelsTable>
      </div>
    </>
  );
};

export default TravelDeskAdvanced;
