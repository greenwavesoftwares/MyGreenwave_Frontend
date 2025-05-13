import { Avatar } from "primereact/avatar";
import { Card } from "primereact/card";
import React from "react";

const LeaveBalanceCard = ({ type, limit, taken, balance, icon }) => {
  return (
    <Card style={{ borderRadius: "25px" }}>
      <div className="flex justify-between mb-2">
        <div className="justify-content-between">
          <div className="font-normal text-md">{type}</div>
          <div className="font-bold text-3xl">
            {taken} / {limit}
          </div>
        </div>
        <Avatar
          icon={icon}
          size="xlarge"
          className="bg-red-500 text-white"
          shape="circle"
        />
      </div>
      <div className="w-full max-w-md">
        <div className="flex h-2 rounded overflow-hidden">
          <div
            className="relative flex items-center justify-center text-xs text-white gap-x-2 bg-red-300"
            style={{
              width: `${(taken / limit) * 100}%`,
            }}
            title={`${type} Taken: ${taken}`}
          ></div>
          <div
            className="relative flex items-center justify-center text-xs text-white gap-x-2 bg-blue-300"
            style={{
              width: `${(balance / limit) * 100}%`,
            }}
            title={`${type} Available: ${balance}`}
          ></div>
        </div>
      </div>
    </Card>
  );
};

export default LeaveBalanceCard;
