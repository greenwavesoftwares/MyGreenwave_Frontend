import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { getConvertedReferredData,downloadResume } from "./ReferralService";
import { Column } from "primereact/column";
import {Button} from "primereact/button"
import { Tag } from "primereact/tag";
import { LinearProgress } from "@mui/material";
const cellStyle = { padding: "8px 12px" };

const HRReferralTable = () => {
  const [referralData, setreferralData] = useState();
  const [loading, setLoading] = useState(false);


   const downloadResumefile = (rowData) => {
      const handleDownloadFile = async (referralId) => {
        try {
           let d = await downloadResume(referralId);
        } catch (error) {
          toast.current.show({
            severity: "error",
            summary: "error",
            detail: "Something Wrong.",
          });
        }
      };
  
      return (
        <Button
          icon="pi pi-download"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            handleDownloadFile(rowData.referralId);
          }}
          tooltip={`${rowData.fileName}`}
        />
      );
    };
  
  useEffect(() => {
    const fetchreferralData = async () => {
      try {
        //Set Loader
        setLoading(true)
        const response = await getConvertedReferredData();
        if (!response.status) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: response.message,
          });
        } else {
          setreferralData(response.data);
        }
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchreferralData();
  }, []);

  console.log("Data table Loader",loading);
  return (
        <DataTable
        value={referralData}
        showGridlines
        paginator
        rows={5} rowsPerPageOptions={[5, 10, 25, 50]}
        size="small"
        className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator dropDownStyle"
        showGridlinesclassName="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        emptyMessage={loading ?  <LinearProgress color="inherit" /> : "No Data Found"}
        >
      <Column
        field="empName"
        header="Referred By"
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
       <Column
        field="dateOfReferral"
        header="Referred On"
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      
      <Column
        field="name"
        header="Candidate Name"
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />

      <Column
        field="email"
        header="Email"
       
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />

      <Column
        field="number"
        header="Number"
      
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      <Column
        field="education"
        header="Education"
       
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      <Column
        field="department"
        header="Department"
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      <Column
        field="technology"
        header="Technology"
       
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      <Column
        field="role"
        header="Role"
      
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      <Column
        field="totalExpYear"
        header="Total Experience(Year)"
       
        headerStyle={{ ...cellStyle,maxWidth:"110px" }}
        bodyStyle={{ ...cellStyle,maxWidth:"110px" }}

      />
      <Column
        field="releventExpYear"
        header="Relevant Experience (Year)"
      
        headerStyle={{ ...cellStyle}}
        bodyStyle={{ ...cellStyle}}
      />
      <Column
        //field="status"
        header="Status"
        body={(ele)=> <Tag severity={ele.status === "Converted" ? "success" : 'warning'} value={ele.status}/>}
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
       <Column
        body={downloadResumefile}
        header="Resume"
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      
    
    </DataTable>
  );
};

export default HRReferralTable;

