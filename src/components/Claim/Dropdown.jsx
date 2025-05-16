import React from "react";
import { Dropdown as PrimeDropdown } from "primereact/dropdown";

const Dropdown = ({ claimOptions, claimType, setClaimType,placehonder }) => {
  return (
    <PrimeDropdown
      value={claimType}
      options={claimOptions}
      onChange={(e) => setClaimType(e.value)}
      placeholder={placehonder}
      className="w-62"
    />
  );
};

export default Dropdown;