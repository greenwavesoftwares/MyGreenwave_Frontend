import CryptoJS from "crypto-js";

const secretKey = import.meta.env.VITE_SECURE_STORAGE_KEY;
const prefix = import.meta.env.VITE_SECURE_STORAGE_PREFIX;

// Encrypt function
function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
}


// Decrypt function

function decryptData(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) return null;

    return JSON.parse(decrypted);
  } catch (err) {
    console.error("Decrypt failed:", err);
    return null;
  }
}

// function decryptData(ciphertext) {
//   const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
//   return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
// }

//set User Deatails
const setUserData = (userDetails) => {
  localStorage.setItem(prefix + "userData", encryptData(userDetails));
};
//get User Deatails
// const getUserData = () => {
//   let data = localStorage.getItem(prefix + "userData");

//   if (data) return decryptData(data);
//   else return null;
// };
const getUserData = () => {
  const data = localStorage.getItem(prefix + "userData");
  if (!data) return null;

  const decrypted = decryptData(data);
  if (!decrypted) {
    localStorage.removeItem(prefix + "userData");
    return null;
  }

  return decrypted;
};


// Decode JWT function
function decodeJWT(token) {
  const [header, payload, signature] = token.split(".");
  const decodedPayload = JSON.parse(atob(payload));
  return decodedPayload;
}

export { setUserData, getUserData, decodeJWT };
