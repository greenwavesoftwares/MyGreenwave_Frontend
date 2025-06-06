import React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "../../components/Grid/Grid";
import { Image } from "primereact/image";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fefefe",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  border: "1px solid #ccc", // Added border
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
    border: "1px solid #444", // Dark mode border
  }),
}));

const OuterItem = styled(Paper)(({ theme }) => ({
  backgroundColor: "#e0e2e2 ",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  border: "1px solid #ccc", // Added border
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
    border: "1px solid #444", // Dark mode border
  }),
}));

export default function SalarySlipPanelGrid({ salaryData }) {
  console.log(salaryData);

  return (
    <Box sx={{ display: "flex", margin: "auto" }}>
      <Grid>
        <OuterItem>
          <Box sx={{ width: "100%" }}>
            <Grid
              container
              rowSpacing={0}
              columnSpacing={{ xs: 0, sm: 0, md: 0 }}
            >
              <Grid size={3}>
                <Item sx={{ height: "60px" }}>
                  <div>
                    {/* <div className="card flex justify-content-center"> */}
                    <Image
                      className="inline-flex"
                      src="src\assets\Images\GreenwaveLogo.png"
                      alt="Image"
                      width="50"
                    />
                    {/* </div> */}
                  </div>
                </Item>
              </Grid>
              <Grid size={9}>
                <Item
                  sx={{ height: "60px", fontSize: "30px", fontWeight: "bold" }}
                >
                  Greenwave Solutions Pvt. Ltd.
                </Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>NAME</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.employeeName}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>EMPLOYEE CODE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.employeeCode}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}> DAYS PAID</Item>
              </Grid>
              <Grid size={3}>
                <Item>{30 - salaryData.ncpDays}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>DESIGNATION</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.designation}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>PAN</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.pan}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>UAN</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.uan}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>ACCOUNT NUMBER</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.bankAccount}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>DISBURSEMENT DATE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.dbDate}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>NAME OF THE BANK</Item>
              </Grid>
              <Grid size={3}>
                <Item>AXIS BANK LTD.</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>BRANCH</Item>
              </Grid>
              <Grid size={3}>
                <Item>PRINCE ANWARSHAH ROAD</Item>
              </Grid>

              <Grid size={12}>
                <Item></Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>EARNINGS</Item>
              </Grid>
              <Grid size={3}>
                <Item>AMOUNT (INR)</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>DEDUCTIONS</Item>
              </Grid>
              <Grid size={3}>
                <Item>AMOUNT (INR)</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>BASIC</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.earnedBasic.toFixed(2)}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>ESI</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.esi.toFixed(2)}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>HOUSE RENT ALLOWANCE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.earnedHouseRent.toFixed(2)}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>EPF</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.deductionAgainstPf.toFixed(2)}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>CONVEYANCE ALLOWANCE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.earnedConveyance.toFixed(2)}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>PROFESSIONAL TAX</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.professionalTax.toFixed(2)}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>MANAGEMENT ALLOWANCE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.earnedManagementAllowance.toFixed(2)}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>TDS</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.tds.toFixed(2)}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>MEDICAL ALLOWANCE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.medicalAllowance.toFixed(2)}</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>AGAINST LOAN</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.deductionAgainstLone.toFixed(2)}</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>SPECIAL ALLOWANCE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.earnedSpecialAllowance.toFixed(2)}</Item>
              </Grid>
              <Grid size={6}>
                <Item>--</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>TELEPHONE ALLOWANCE</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.earnedPhoneAllowane.toFixed(2)}</Item>
              </Grid>

              <Grid size={6}>
                <Item>--</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>ARREAR</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.arrear.toFixed(2)}</Item>
              </Grid>
              <Grid size={6}>
                <Item>--</Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>RETENTION BONUS</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.earnedAssuredBonus.toFixed(2)}</Item>
              </Grid>
              <Grid size={6}>
                <Item>--</Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>PERFORMANCE BONUS</Item>
              </Grid>

              <Grid size={3}>
                <Item>{salaryData.earnedPerformanceBonus.toFixed(2)}</Item>
              </Grid>
              <Grid size={6}>
                <Item>--</Item>
              </Grid>

              <Grid size={12}>
                <Item></Item>
              </Grid>
              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>GROSS TOTAL EARNINGS</Item>
              </Grid>
              <Grid size={3}>
                <Item>
                  {(
                    (salaryData.earnedGross ?? 0) +
                    (salaryData.earnedPhoneAllowane ?? 0) +
                    (salaryData.earnedAssuredBonus ?? 0) +
                    (salaryData.earnedPerformanceBonus ?? 0) +
                    (salaryData.medicalAllowance ?? 0) +
                    (salaryData.arrear ?? 0)
                  ).toFixed(2)}
                </Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>GROSS TOTAL DEDUCTIONS</Item>
              </Grid>
              <Grid size={3}>
                <Item>
                  {(
                    (salaryData.deductionAgainstLone ?? 0) +
                    (salaryData.deductionAgainstPf ?? 0) +
                    (salaryData.esi ?? 0) +
                    (salaryData.tds ?? 0) +
                    (salaryData.professionalTax ?? 0)
                  ).toFixed(2)}
                </Item>
              </Grid>

              <Grid size={3}>
                <Item sx={{ fontWeight: "bold" }}>NET PAYS</Item>
              </Grid>
              <Grid size={3}>
                <Item>{salaryData.netpayable.toFixed(2)}</Item>
              </Grid>

              <Grid size={6}>
                <Item>--</Item>
              </Grid>
              <Grid size={12}>
                <Item></Item>
              </Grid>
              <Grid size={12}>
                <Item>
                  <div>
                    {/* <div className="card flex justify-content-center"> */}
                    <Image
                      className="inline-flex"
                      src="src\assets\Images\softSign.jpg"
                      alt="Image"
                      width="50"
                    />
                    {/* </div> */}
                  </div>
                </Item>
              </Grid>
              <Grid size={12}>
                <Item sx={{ fontWeight: "bold" }}>Accounts Manager</Item>
              </Grid>
            </Grid>
          </Box>
        </OuterItem>
      </Grid>
    </Box>
  );
}
