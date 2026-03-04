import axios from "axios";

const dummyData = [
  {
    today: [
      {
        name: "user1",
        id: "01TODAY000000000000001",
        scanTime: "3/4/2026",
        lunchType: "Lunch",
        scanStatus: "Scanned",
      },
      {
        name: "user2",
        id: "01TODAY000000000000002",
        scanTime: "3/4/2026",
        lunchType: "Breakfast",
        scanStatus: "Pending",
      },
      {
        name: "user3",
        id: "01TODAY000000000000003",
        scanTime: "3/4/2026",
        lunchType: "Dinner",
        scanStatus: "Scanned",
      },
      {
        name: "user5",
        id: "01TODAY000000000000005",
        scanTime: "3/4/2026",
        lunchType: "Breakfast",
        scanStatus: "Scanned",
      },
      {
        name: "user6",
        id: "01TODAY000000000000006",
        scanTime: "3/4/2026",
        lunchType: "Dinner",
        scanStatus: "Pending",
      },
      {
        name: "user7",
        id: "01TODAY000000000000007",
        scanTime: "3/4/2026",
        lunchType: "Lunch",
        scanStatus: "Scanned",
      },
      {
        name: "user8",
        id: "01TODAY000000000000008",
        scanTime: "3/4/2026",
        lunchType: "Breakfast",
        scanStatus: "Pending",
      },
      {
        name: "user9",
        id: "01TODAY000000000000009",
        scanTime: "3/4/2026",
        lunchType: "Dinner",
        scanStatus: "Scanned",
      },
      {
        name: "user10",
        id: "01TODAY000000000000010",
        scanTime: "3/4/2026",
        lunchType: "Lunch",
        scanStatus: "Pending",
      },
    ],
  },
  {
    tomorrow: [
      {
        name: "user11",
        id: "01TOMORROW00000000000001",
        scanTime: "3/5/2026",
        lunchType: "Lunch",
        scanStatus: "Scanned",
      },
      {
        name: "user12",
        id: "01TOMORROW00000000000002",
        scanTime: "3/5/2026",
        lunchType: "Breakfast",
        scanStatus: "Pending",
      },
      {
        name: "user13",
        id: "01TOMORROW00000000000003",
        scanTime: "3/5/2026",
        lunchType: "Dinner",
        scanStatus: "Scanned",
      },
      {
        name: "user14",
        id: "01TOMORROW00000000000004",
        scanTime: "3/5/2026",
        lunchType: "Lunch",
        scanStatus: "Pending",
      },
      {
        name: "user15",
        id: "01TOMORROW00000000000005",
        scanTime: "3/5/2026",
        lunchType: "Breakfast",
        scanStatus: "Scanned",
      },
      {
        name: "user16",
        id: "01TOMORROW00000000000006",
        scanTime: "3/5/2026",
        lunchType: "Dinner",
        scanStatus: "Pending",
      },
      {
        name: "user17",
        id: "01TOMORROW00000000000007",
        scanTime: "3/5/2026",
        lunchType: "Lunch",
        scanStatus: "Scanned",
      },
      {
        name: "user18",
        id: "01TOMORROW00000000000008",
        scanTime: "3/5/2026",
        lunchType: "Breakfast",
        scanStatus: "Pending",
      },
      {
        name: "user19",
        id: "01TOMORROW00000000000009",
        scanTime: "3/5/2026",
        lunchType: "Dinner",
        scanStatus: "Scanned",
      },
      {
        name: "user20",
        id: "01TOMORROW00000000000010",
        scanTime: "3/5/2026",
        lunchType: "Lunch",
        scanStatus: "Pending",
      },
    ],
  },
];

//Dummy Data Call
async function dummyDataAPICall() {
  return new Promise((resolve)=>{
    setTimeout(() => {
      resolve(dummyData)
    }, 5 *1000);

  })

}

//Post Mock Server Call
// async function dummyDataAPICall() {
//   try {
//     const response = await axios.get(
//       "https://2d27db31-fcae-4057-9469-76b858cc22c8.mock.pstmn.io/meal",
//     );
//     console.log("ap");
//     return response?.data || [];
//   } catch (error) {
//     console.log("Meal_Booked api error", error);
//     throw error;
//   }
// }

export default dummyDataAPICall;
