import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getStorage }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {

  apiKey: "AIzaSyDOmbtCNoR6VnU9HkU8rephglenjt41FTQ",

  authDomain: "dhaka-poshur-hat.firebaseapp.com",

  projectId: "dhaka-poshur-hat",

  storageBucket: "dhaka-poshur-hat.firebasestorage.app",

  messagingSenderId: "432757690265",

  appId: "1:432757690265:web:f922ceaf041fb8367e8d08"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);

// Modal

const loginModal =
  document.getElementById("loginModal");

const uploadBtn =
  document.getElementById("uploadBtn");

uploadBtn.addEventListener("click", () => {

  loginModal.style.display = "flex";
});

// Recaptcha

window.recaptchaVerifier =
  new RecaptchaVerifier(

    auth,

    "recaptcha-container",

    {
      size: "normal",
    }
  );

// Send OTP

document
  .getElementById("sendOtpBtn")
  .addEventListener("click", async () => {

    const phoneNumber =
      document.getElementById("phoneNumber").value;

    try {

      const confirmationResult =
        await signInWithPhoneNumber(
          auth,
          phoneNumber,
          window.recaptchaVerifier
        );

      window.confirmationResult =
        confirmationResult;

      alert("OTP sent successfully");

    } catch (error) {

      console.error(error);

      alert(error.message);
    }
  });

// Verify OTP

document
  .getElementById("verifyOtpBtn")
  .addEventListener("click", async () => {

    const code =
      document.getElementById("otpCode").value;

    try {

      await window.confirmationResult.confirm(code);

      alert("Login successful");

      loginModal.style.display = "none";

    } catch (error) {

      console.error(error);

      alert("Invalid OTP");
    }
  });
