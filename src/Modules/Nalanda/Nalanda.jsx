import React, { useEffect, useState } from "react";
import { getNalandaData,certificateDownload} from "./NalandaAPI";
import { getUserData } from "../Login/Encrypt";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Button, Chip, LinearProgress, Tooltip, Typography } from "@mui/material";
import { formatDate } from "../Appraisal/formatDate";

const Nalanda = () => {
    //
  const [nalanda, setNalanda] = useState([]);
  const [loader,setLoader]=useState(false)
  useEffect(() => {
    const { token } = getUserData();
    const getData = async () => {
      setLoader(true)
      const response = await getNalandaData(token);
      console.log("response", response);
      setLoader(false)

      setNalanda(response?.data.trainingEventTablelist);
    };

    getData();
  }, []);

  //Certificate Download 
  const handelDownload=async(eventId)=>{
    console.log("click_btn_eventId",eventId);
    const { token } = getUserData();
    const response= await certificateDownload(token,eventId)
    console.log("download_btn",response);

  }
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="cardStyle mt-4 bg-white shadow rounded">
            <DataTable
              size="small"
              emptyMessage={
                loader ? <LinearProgress color="inherit" /> : "No Data Found"
              }
              header={<Typography className="text-sm">Nalanda</Typography>}
              value={nalanda}
              showGridlines
              className="dataTableHeader dataTableBody dataTableBodyPadding"
            >
              <Column
                header="Form Date"
                body={(rowData) => {
                  return (
                    <Typography sx={{ fontSize: "0.8rem" }}>
                      {formatDate(rowData.fromDate)}
                    </Typography>
                  );
                }}
              ></Column>
              <Column
                header="To Date"
                body={(rowData) => {
                  return (
                    <Typography sx={{ fontSize: "0.8rem" }}>
                      {formatDate(rowData.toDate)}
                    </Typography>
                  );
                }}
              ></Column>
              <Column
                header="Training Name"
                style={{ width: "30rem" }}
                field="trainingName"
              ></Column>
              <Column
                header="Status"
                body={(rowData) => {
                  return (
                    <Chip
                      size="small"
                      color={
                        rowData.status.toLowerCase() === "completed"
                          ? "success"
                          : "warning"
                      }
                      label={rowData.status}
                    />
                  );
                }}
              ></Column>
              <Column
                header="Certificate"
                body={(rowData) => {
                  return (
                    <>
                    <Tooltip title={rowData.isCertificateAvailable ? "Download Now": "Certificate Not Available"}  followCursor>
                   <div>
                    <Button
                      variant="contained"
                      sx={{boxShadow:"none"}}
                      disabled={!rowData.isCertificateAvailable}
                      onClick={()=>{
                        handelDownload(rowData.eventId)
                      }}
                      size="small"
                    >
                      Download
                    </Button>
                    </div>
                    </Tooltip>
                    </>
                  );
                }}
              ></Column>
            </DataTable>
          </div>
        </div>
      </div>
    </>
  );
};
export default Nalanda;
