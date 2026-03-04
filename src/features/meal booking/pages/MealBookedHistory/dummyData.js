 const dummyData = [
  {
    name: "madderson0",
    id: "01KJQ0DGAS5AT9ZMEW6T9T2TJB",
    scanTime: "3/17/2025",
    lunchType: "Overhold",
    scanStatus: "Gusti Syamsir Alam Airport",
  },
  {
    name: "cdeane1",
    id: "01KJQ0DGATK689QQD50CPHW1B7",
    scanTime: "4/11/2025",
    lunchType: "Kanlam",
    scanStatus: "Matão Airport",
  },
  {
    name: "vstorrier2",
    id: "01KJQ0DGATZBTRW5HQNPKDCP7R",
    scanTime: "1/30/2026",
    lunchType: "Temp",
    scanStatus: "Nefteyugansk Airport",
  },
  {
    name: "wlinnett3",
    id: "01KJQ0DGAVEGVWMC8C74YQY3S3",
    scanTime: "6/10/2025",
    lunchType: "Zaam-Dox",
    scanStatus: "Antsoa Airport",
  },
  {
    name: "cpoole4",
    id: "01KJQ0DGAW3KTR31KKT0SM9HTA",
    scanTime: "4/22/2025",
    lunchType: "Ventosanzap",
    scanStatus: "RAF West Malling",
  },
  {
    name: "scowperthwaite5",
    id: "01KJQ0DGAW2BQ9Z5GQ4A739401",
    scanTime: "12/5/2025",
    lunchType: "Treeflex",
    scanStatus: "Taylor Airport",
  },
  {
    name: "ahirche6",
    id: "01KJQ0DGAX9M1JCXG7JVSGMW7K",
    scanTime: "5/24/2025",
    lunchType: "Aerified",
    scanStatus: "San Miguel Airport",
  },
  {
    name: "lyakob7",
    id: "01KJQ0DGAY80CBYZZ5EFCKG3Y9",
    scanTime: "6/13/2025",
    lunchType: "Bamity",
    scanStatus: "Bulagtai Resort Airport",
  },
  {
    name: "zgiovanni8",
    id: "01KJQ0DGAYGKJ9HXGGAP9XRRY8",
    scanTime: "12/20/2025",
    lunchType: "Tempsoft",
    scanStatus: "Whakatane Airport",
  },
  {
    name: "lrentilll9",
    id: "01KJQ0DGAZ9MBN70NQRF7QBY39",
    scanTime: "1/10/2026",
    lunchType: "Overhold",
    scanStatus: "Tougan Airport",
  },
];


async function dummyDataAPICall() {
  return new Promise((resolve)=>{
    setTimeout(() => {
      resolve(dummyData)
    }, 5*1000);

  })
  
}

export default dummyDataAPICall;
