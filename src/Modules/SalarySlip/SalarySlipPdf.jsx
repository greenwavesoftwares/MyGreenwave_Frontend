import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { Button } from "primereact/button";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    position: "relative",
  },

  content: {
    flexGrow: 1, // Makes sure it doesn't overlap footer
  },

  headerimg: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 10,
  },

  logoContainer: {
    position: "absolute",
    left: 0,
  },

  logo: {
    width: 50,
    height: 50,
  },

  headertext: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
    textTransform: "uppercase",
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 0, // Removes extra space
  },
  table: { width: "100%", borderWidth: 1, borderColor: "#000" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  cell: { width: "28%", padding: 5, borderRightWidth: 1, borderColor: "#000" },
  cellsmall: {
    width: "22%",
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#000",
  },
  cellHeader: { fontWeight: "bold", backgroundColor: "#f2f2f2" },
  centerText: { textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#000",
    paddingTop: 8,
  },

  footerLeft: {
    width: "60%",
  },

  footerText: {
    fontSize: 8,
    lineHeight: 1.3,
  },

  footerRight: {
    width: "35%",
    alignItems: "flex-end",
  },
  signatureSection: {
    marginTop: 20,
    alignItems: "flex-end", // Aligns to right
  },
  signatureImage: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },

  signatureLabel: {
    fontSize: 9,
    textDecoration: "underline",
    marginTop: 4,
  },
});

const MyDocument = ({ salaryData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerimg}>
        <View style={styles.logoContainer}>
          <Image
            src={"src/assets/Images/GreenwaveLogo.png"}
            style={styles.logo}
          />
        </View>
        <View style={styles.headertext}>
          <Text style={styles.title}>GREENWAVE SOLUTIONS PVT. LTD.</Text>
          <Text style={styles.subtitle}>
            SALARY SLIP - {salaryData.yearmonth}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>NAME</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {salaryData.employeeName}
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>EMPLOYEE CODE</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {salaryData.employeeCode}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>DAYS PAID</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {30 - salaryData.ncpDays}
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>DESIGNATION</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {salaryData.designation}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>PAN</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {salaryData.pan}
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>UAN</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {salaryData.uan}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>ACCOUNT NUMBER</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {salaryData.bankAccount}
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>
            DISBURSEMENT DATE
          </Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            {salaryData.dbDate}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>NAME OF THE BANK</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            AXIS BANK LTD.
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>BRANCH</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            PRINCE ANWARSHAH ROAD
          </Text>
        </View>
      </View>

      {/* EARNINGS & DEDUCTIONS */}
      <View style={[styles.table, { marginTop: 10 }]}>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>EARNINGS</Text>
          <Text style={[styles.cellsmall, styles.cellHeader]}>
            AMOUNT (INR)
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>DEDUCTIONS</Text>
          <Text style={[styles.cellsmall, styles.cellHeader]}>
            AMOUNT (INR)
          </Text>
        </View>

        {[
          [
            "BASIC",
            salaryData.earnedBasic.toFixed(2),
            "ESI",
            salaryData.esi.toFixed(2),
          ],
          [
            "HOUSE RENT ALLOWANCE",
            salaryData.earnedHouseRent.toFixed(2),
            "EPF",
            salaryData.deductionAgainstPf.toFixed(2),
          ],
          [
            "CONVEYANCE ALLOWANCE",
            salaryData.earnedConveyance.toFixed(2),
            "PROFESSIONAL TAX",
            salaryData.professionalTax.toFixed(2),
          ],
          [
            "MANAGEMENT ALLOWANCE",
            salaryData.earnedManagementAllowance.toFixed(2),
            "TDS",
            salaryData.tds.toFixed(2),
          ],
          [
            "MEDICAL ALLOWANCE",
            salaryData.medicalAllowance.toFixed(2),
            "AGAINST LOAN",
            salaryData.deductionAgainstLone.toFixed(2),
          ],
          [
            "SPECIAL ALLOWANCE",
            salaryData.earnedSpecialAllowance.toFixed(2),
            "--",
            "--",
          ],
          [
            "TELEPHONE ALLOWANCE",
            salaryData.earnedPhoneAllowane.toFixed(2),
            "--",
            "--",
          ],
          ["ARREAR", salaryData.arrear.toFixed(2), "--", "--"],
          [
            "RETENTION BONUS",
            salaryData.earnedAssuredBonus.toFixed(2),
            "--",
            "--",
          ],
          [
            "PERFORMANCE BONUS",
            salaryData.earnedPerformanceBonus.toFixed(2),
            "--",
            "--",
          ],
        ].map((row, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>{row[0]}</Text>
            <Text style={styles.cellsmall}>{row[1]}</Text>
            {row[2] === "--" ? (
              <Text style={{ width: "50%" }}></Text>
            ) : (
              <>
                <Text style={styles.cell}>{row[2]}</Text>
                <Text style={styles.cellsmall}>{row[3]}</Text>
              </>
            )}
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.row}>
        <Text style={[styles.cell, styles.cellHeader]}>
          GROSS TOTAL EARNINGS
        </Text>
        <Text style={[styles.cellsmall, styles.cellHeader]}>
          {(
            (salaryData.earnedGross ?? 0) +
            (salaryData.earnedPhoneAllowane ?? 0) +
            (salaryData.earnedAssuredBonus ?? 0) +
            (salaryData.earnedPerformanceBonus ?? 0) +
            (salaryData.medicalAllowance ?? 0) +
            (salaryData.arrear ?? 0)
          ).toFixed(2)}
        </Text>

        <Text style={[styles.cell, styles.cellHeader]}>
          GROSS TOTAL DEDUCTIONS
        </Text>
        <Text style={[styles.cellsmall, styles.cellHeader]}>
          {(
            (salaryData.deductionAgainstLone ?? 0) +
            (salaryData.deductionAgainstPf ?? 0) +
            (salaryData.esi ?? 0) +
            (salaryData.tds ?? 0) +
            (salaryData.professionalTax ?? 0)
          ).toFixed(2)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            {
              width: "50%",
              padding: 5,
              borderRightWidth: 1,
              borderColor: "#000",
            },
            styles.cellHeader,
          ]}
        >
          NET PAY (INR)
        </Text>
        <Text
          style={[
            {
              width: "50%",
              padding: 5,
              borderRightWidth: 1,
              borderColor: "#000",
            },
            styles.cellHeader,
          ]}
        >
          {salaryData.netpayable.toFixed(2)}
        </Text>
      </View>
      <View style={styles.signatureSection}>
        <Image
          src="src\assets\Images\softSign copy.jpg"
          style={styles.signatureImage}
        />
        <Text style={styles.signatureLabel}>Accounts Manager</Text>
      </View>

      <View style={styles.footer}>
        {/* Left: Address */}
        <View style={styles.addressBlock}>
          <Text>Greenwave Solutions Pvt. Ltd.</Text>
          <Text>
            Office - G 02 03 04 05, Webel IT Park, P1 Taratala Road, Kolkata -
            700088
          </Text>
          <Text>Works - Webel HRDC, P1 Taratala Road, Kolkata - 700088</Text>
          <Text>Phone - 033 2401 2256, CIN U72200WB2010PTC150431</Text>
          <Text>Email - info@greenwave.co.in</Text>
        </View>
      </View>
    </Page>
  </Document>
);

const SalarySlipPdf = ({ salaryData }) => {
  const generatePdf = async () => {
    // Format current date and time
    const now = new Date();
    const formattedDateTime = `${now.getFullYear()}.${String(
      now.getMonth() + 1
    ).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${String(
      now.getHours()
    ).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}.${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    // Format employee name (capitalize first letter of each word)
    const employeeName = (salaryData.employeeName ?? "Employee")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Final filename
    const fileName = `${employeeName}_Salary_Slip_${formattedDateTime}.pdf`;

    const blob = await pdf(<MyDocument salaryData={salaryData} />).toBlob();
    saveAs(blob, fileName);
  };

  return (
    <div>
      <Button
        label=""
        icon="pi pi-file-pdf" // PDF icon from PrimeIcons
        className="p-button-danger" // Red color like PDF style
        onClick={generatePdf}
        rounded
        size="small"
      />
    </div>
  );
};

export default SalarySlipPdf;
