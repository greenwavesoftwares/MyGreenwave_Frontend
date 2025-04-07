import CryptoJS from 'crypto-js';

const secretKey = import.meta.env.VITE_SECURE_STORAGE_KEY || 'Bruh';
const prefix = import.meta.env.VITE_SECURE_STORAGE_PREFIX || 'Bruh';

// Encrypt function
function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
}
// Decrypt function
function decryptData(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}


//set User Deatails 
const setUserData = (userDetails) => {
    let key=(prefix,'userData');
    localStorage.setItem(key, encryptData(userDetails));
};
//get User Deatails 
const getUserData = () => {
    let key=(prefix,'userData');
    const user = decryptData(localStorage.getItem(key));
    return user;
};
export {setUserData,getUserData}