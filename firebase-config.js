// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyC_K8OpaHkoSzha3pLI03Tu6sZ190p_z2o",
    authDomain: "medibridge-loginpage.firebaseapp.com",
    projectId: "medibridge-loginpage",
    storageBucket: "medibridge-loginpage.firebasestorage.app",
    messagingSenderId: "840197772490",
    appId: "1:840197772490:web:3522fefffe6414fc6ad033"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
