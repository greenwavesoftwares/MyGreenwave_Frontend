import React, { useState } from 'react'
import CustomButton from "../../components/Button/Button";
import {
  CustomColumn,
  DataTableComponent,
} from "../../components/DataTable/DataTableComponent";

const LeaveMaster = () => {
    const cellStyle = { padding: "8px 12px" };
    const [togglesavebutton,settoggleSaveButton]=useState(false);
    let tableData=[
        {year:2020,casual_leave:10,privilege_leave:10,medical_leave:10,work_from_home:10,paternity_leave:20,maternity_leave:90},
        {year:2021,casual_leave:10,privilege_leave:10,medical_leave:10,work_from_home:10,paternity_leave:20,maternity_leave:90},
        {year:2022,casual_leave:10,privilege_leave:10,medical_leave:10,work_from_home:10,paternity_leave:20,maternity_leave:90},
        {year:2023,casual_leave:10,privilege_leave:10,medical_leave:10,work_from_home:10,paternity_leave:20,maternity_leave:90},
        {year:2024,casual_leave:10,privilege_leave:10,medical_leave:10,work_from_home:10,paternity_leave:20,maternity_leave:90},
        {year:2025,casual_leave:10,privilege_leave:10,medical_leave:10,work_from_home:10,paternity_leave:20,maternity_leave:90}]
  const actionbody=()=>{
    

    return(
        <>
{togglesavebutton?
        <CustomButton/>:<span>Saved</span>}   
        </>
    )
  }

  const columnbody =()=>{
    return 
    (
        <div>
         <InputNumber inputId="withoutgrouping" value={value2} onValueChange={(e) => setValue2(e.value)} useGrouping={false} />
         </div>
    )
  }
  return (
    <div>
        <div className='flex justify-end'>       
        <CustomButton
        icon="pi pi-plus"
       
       severity='success'
        onClick={() => {
          //handleDownloadFile(rowData.claim_id);
        }}
        //tooltip={'Add Row'}  
        label='Add Row'      
      />
      </div>
      <div className='mt-2'>

      <DataTableComponent
        data={tableData}
        rows={10}
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
        <CustomColumn field="year" header="Year"   />
        <CustomColumn field="casual_leave" header="Casual Leave"  />
        <CustomColumn field="privilege_leave" header="Privilege Leave" />
        <CustomColumn field="medical_leave" header="Medical Leave"  />
        <CustomColumn field="work_from_home" header="Work From Home"/>
        <CustomColumn field="paternity_leave" header="Paternity Leave" />
        <CustomColumn field="maternity_leave" header="Maternity Leave"/> 
        <CustomColumn
          body={actionbody}
          header="Action"
          headerStyle={{ ...cellStyle }}
          bodyStyle={{ ...cellStyle }}
        />
      </DataTableComponent>
      </div>
    </div>
  )
}

export default LeaveMaster