import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { getUserReferredData,downloadResume } from "./ReferralService";
import { Column } from "primereact/column";
import {Button} from "primereact/button"
const cellStyle = { padding: "8px 12px" };

const ReferralTable = () => {
  const [referralData, setreferralData] = useState();
  const [loading, setLoading] = useState();


   const downloadResumeFile = (rowData) => {
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
        const response = await getUserReferredData();
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

  return (
    <DataTable
      value={referralData}
      loading={loading}
      showGridlines
      paginator
      rows={10}
      showGridlinesclassName="text-xs"
      tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
    >
      
       <Column
        field="dateOfReferral"
        header="Referred On"
        
        headerStyle={{ ...cellStyle,minWidth:"107px" }}
        bodyStyle={{ ...cellStyle,minWidth:"107px" }}
      />
      <Column
        field="name"
        header="Candidate Name"
        
        headerStyle={{ ...cellStyle,minWidth:"107px" }}
        bodyStyle={{ ...cellStyle ,minWidth:"107px"}}
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
        field="status"
        header="Status"
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
       <Column
        body={downloadResumeFile}
        header="Resume"
        
        headerStyle={{ ...cellStyle }}
        bodyStyle={{ ...cellStyle }}
      />
      
    
    </DataTable>
  );
};

export default ReferralTable;
