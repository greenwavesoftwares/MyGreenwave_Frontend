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
    borderWidth: 2,
    borderColor: "#000",
    borderStyle: "solid",
    width: "100%",
    height: "100%",
  },
  headerimg: {
    alignItems: "left",
    marginBottom: 10,
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
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
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
});

const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo and Title */}
      <View style={styles.headerimg}>
        <Image src={"/GreenwaveLogo.png"} style={styles.logo} />
        <View style={styles.headertext}>
          <Text style={styles.title}>GREENWAVE SOLUTIONS PVT. LTD.</Text>
          <Text style={styles.subtitle}>SALARY SLIP - FEBRUARY 2024</Text>
        </View>
      </View>

      {/* Employee Details Table */}
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>NAME</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            SOHOME SARKAR
          </Text>
          <Text style={[styles.cell, styles.cellHeader]}>EMPLOYEE CODE</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>1234</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>DAYS PAID</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>30</Text>
          <Text style={[styles.cell, styles.cellHeader]}>DESIGNATION</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>
            Software Engineer
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>PAN</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>PTJ11234</Text>
          <Text style={[styles.cell, styles.cellHeader]}>UAN</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>134555</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHeader]}>ACCOUNT NUMBER</Text>
          <Text style={[styles.cellsmall, styles.centerText]}>PTJ11234</Text>
          <Text style={[styles.cell, styles.cellHeader]}>
            DISBURSEMENT DATE
          </Text>
          <Text style={[styles.cellsmall, styles.centerText]}>13/45/2055</Text>
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

      {/* Earnings & Deductions Table */}
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
          ["BASIC", "0.0", "ESI", "0.0"],
          ["HOUSE RENT ALLOWANCE", "0.0", "EPF", "0.0"],
          ["CONVEYANCE ALLOWANCE", "0.0", "EPF", "0.0"],
          ["MANAGEMENT ALLOWANCE", "0.0", "PROFESSIONAL TAX", "0.0"],
          ["SPECIAL ALLOWANCE", "0.0", "--", "--"],
          ["TELEPHONE ALLOWANCE", "0.0", "--", "--"],
          ["ARREAR", "0.0", "--", "--"],
          ["RETENTION BONUS", "0.0", "--", "--"],
          ["PERFORMANCE BONUS", "0.0", "--", "--"],
        ].map((row, index) => (
          <View key={index} style={styles.row}>
            <Text style={[styles.cell]}>{row[0]}</Text>
            <Text style={styles.cellsmall}>{row[1]}</Text>

            {/* Check if the third column is "--", merge cells */}
            {row[2] === "--" ? (
              <Text style={[{ width: "50%" }]}> </Text> // Empty merged cell
            ) : (
              <>
                <Text style={styles.cell}>{row[2]}</Text>
                <Text style={styles.cellsmall}>{row[3]}</Text>
              </>
            )}
          </View>
        ))}
      </View>
      <View style={styles.row}>
        <Text style={[styles.cell, styles.cellHeader]}>
          GROSS TOTAL EARNINGS
        </Text>
        <Text style={[styles.cellsmall, styles.cellHeader]}>0.0</Text>
        <Text style={[styles.cell, styles.cellHeader]}>
          GROSS TOTAL DEDUCTIONS
        </Text>
        <Text style={[styles.cellsmall, styles.cellHeader]}>0.0</Text>
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
          0.0
        </Text>
      </View>
    </Page>
  </Document>
);

const generatePdf = async () => {
  const blob = await pdf(<MyDocument />).toBlob();
  saveAs(blob, "document.pdf");
};

const SalarySlipPdf = () => (
  <div>
    <Button
      label=""
      icon="pi pi-file-pdf" // PDF icon from PrimeIcons
      className="p-button-danger" // Red color like PDF style
      onClick={generatePdf}
    />
  </div>
);

export default SalarySlipPdf;
