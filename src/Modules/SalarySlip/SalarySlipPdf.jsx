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
          <Text style={styles.subtitle}>SALARY SLIP - {salaryData.yearmonth}</Text>
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
          ["BASIC", salaryData.earnedBasic, "ESI", salaryData.esi],
          [
            "HOUSE RENT ALLOWANCE",
            salaryData.earnedHouseRent,
            "EPF",
            salaryData.deductionAgainstPf,
          ],
          [
            "CONVEYANCE ALLOWANCE",
            salaryData.earnedConveyance,
            "PROFESSIONAL TAX",
            salaryData.professionalTax,
          ],
          [
            "MANAGEMENT ALLOWANCE",
            salaryData.earnedManagementAllowance,
            "TDS",
            salaryData.tds,
          ],
          [
            "MEDICAL ALLOWANCE",
            salaryData.medicalAllowance,
            "AGAINST LOAN",
            salaryData.deductionAgainstLone,
          ],
          ["SPECIAL ALLOWANCE", salaryData.earnedSpecialAllowance, "--", "--"],
          ["TELEPHONE ALLOWANCE", salaryData.earnedPhoneAllowane, "--", "--"],
          ["ARREAR", salaryData.arrear, "--", "--"],
          ["RETENTION BONUS", salaryData.earnedAssuredBonus, "--", "--"],
          ["PERFORMANCE BONUS", salaryData.earnedPerformanceBonus, "--", "--"],
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
          {salaryData.earnedGross +
            salaryData.earnedPhoneAllowane +
            salaryData.earnedAssuredBonus +
            salaryData.earnedPerformanceBonus +
            salaryData.medicalAllowance +
            salaryData.arrear}
        </Text>
        <Text style={[styles.cell, styles.cellHeader]}>
          GROSS TOTAL DEDUCTIONS
        </Text>
        <Text style={[styles.cellsmall, styles.cellHeader]}>
          {salaryData.deductionAgainstLone +
            salaryData.deductionAgainstPf +
            salaryData.esi +
            salaryData.tds +
            salaryData.professionalTax}
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
          {salaryData.netpayable}
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
    const blob = await pdf(<MyDocument salaryData={salaryData} />).toBlob();
    saveAs(blob, "document.pdf");
  };

  return (
    <div>
      <Button
        label=""
        icon="pi pi-file-pdf" // PDF icon from PrimeIcons
        className="p-button-danger" // Red color like PDF style
        onClick={generatePdf}
      />
    </div>
  );
};

export default SalarySlipPdf;
