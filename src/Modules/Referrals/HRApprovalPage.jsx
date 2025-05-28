import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getReferredData,rejectReferral,approveReferral,downloadResume } from "./ReferralService";
const cellStyle = { padding: "8px 12px" };
import { Toast } from "primereact/toast";
import {Button} from "primereact/button"

const HRApprovalPage = () => {
  const toast = useRef(null);
  const [referredData, setreferredData] = useState();
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

      const actionbody = (rowData) => {
         const [remarks,setRemarks]=useState()
          
          const handleRejectClick=async(referralId,remarks)=>{
          try{
                let response=  await rejectReferral(referralId,remarks)
                if(response.status)
                {
                  setreferredData(response.data)
                   toast.current.show({ 
                      severity: 'success', 
                      summary: 'Success', 
                      detail: response.message
                  });
                 
                }else
                {
                toast.current.show({
                severity: "error",
                summary: "error",
                detail: response.message,
              });
                }
             }catch(error)
             {
                toast.current.show({
                severity: "error",
                summary: "error",
                detail: error?.message
              });
             }
         
          }
           const handleApproveClick=async(referralId,remarks)=>{
              try{
                    let response=  await approveReferral(referralId,remarks)
                    if(response.status)
                    {
                      setreferredData(response.data)
                       toast.current.show({ 
                          severity: 'success', 
                          summary: 'Success', 
                          detail: response.message
                      });
                     
                    }else
                    {
                    toast.current.show({
                    severity: "error",
                    summary: "error",
                    detail: response.message,
                  });
                    }
                 }catch(error)
                 {
                    toast.current.show({
                    severity: "error",
                    summary: "error",
                    detail: error?.message
                  });
                 }
             
              }
              
            return (
              <div className="flex flex-col gap-y-2 max-w-xs"> {/* limits total width */}
                <textarea
                  placeholder="remarks"
                  className="border border-md rounded-md p-2 w-full"
                  rows={2}
                  value={remarks}
               onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
                <div className="flex gap-x-1">
                  <Button
                    label="Approve"
                    size="small"
                    severity="success"
                    onClick={()=>handleApproveClick(rowData.referralId,remarks)}
                    
                   
                  />
                  <Button
                    label="Reject"
                    size="small"
                    severity="danger"
                    onClick={()=>handleRejectClick(rowData.referralId,remarks)}
             
                  />
                </div>
              </div>
            );
          };
          

  useEffect(() => {
    const fetchreferredetails = async () => {
      try {
        const result = await getReferredData();
        if (!result.status) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: result.message,
          });
        } else {
          setreferredData(result.data);
        }
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchreferredetails();
  }, []);

  return (
    <div>
      <Toast ref={toast} />
      <DataTable
           value={referredData}
           loading={loading}
           showGridlines
           paginator
           rows={10}
           showGridlinesclassName="text-xs"
           tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
         >
          
           <Column
             field="empName"
             header="Referred By"
             
             headerStyle={{ ...cellStyle, }}
             bodyStyle={{ ...cellStyle, }}
           />
          <Column
             field="dateOfReferral"
             header="Referred On"
             
             headerStyle={{ ...cellStyle,minWidth:"107px" }}
             bodyStyle={{ ...cellStyle,minWidth:"107px" }}
           />
            
            {/* <Column
             field="designation"
             header="Designation"
             
             headerStyle={{ ...cellStyle }}
             bodyStyle={{ ...cellStyle }}
           /> */}
        
           <Column
             field="name"
             header="Candidate Name"
             
             headerStyle={{ ...cellStyle,}}
             bodyStyle={{ ...cellStyle,}}
           />
           <Column
             field="email"
             header="Email"
            
             headerStyle={{ ...cellStyle,}}
             bodyStyle={{ ...cellStyle, }}
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
            
             headerStyle={{ ...cellStyle,maxWidth:"107px", whiteSpace: 'normal', wordWrap: 'break-word'}}
             bodyStyle={{ ...cellStyle,maxWidth:"107px",whiteSpace: 'normal', wordWrap: 'break-word' }}
     
           />
           <Column
             field="releventExpYear"
             header="Relevant Experience (Year)"
           
             headerStyle={{ ...cellStyle,maxWidth:"107px",whiteSpace: 'normal', wordWrap: 'break-word'}}
             bodyStyle={{ ...cellStyle,maxWidth:"107px",whiteSpace: 'normal', wordWrap: 'break-word'}}
           />
           {/* <Column
             field="status"
             header="status"
             
             headerStyle={{ ...cellStyle }}
             bodyStyle={{ ...cellStyle }}
           /> */}
            <Column
             body={downloadResumeFile}
             header="Resume"
             
             headerStyle={{ ...cellStyle }}
             bodyStyle={{ ...cellStyle }}
           />
              <Column
                   body={actionbody}
                   header="Action"
                   
                   headerStyle={{...cellStyle,}}
                   bodyStyle={{...cellStyle}}
                 />
           
         
         </DataTable>
    </div>
  );
};

export default HRApprovalPage;


