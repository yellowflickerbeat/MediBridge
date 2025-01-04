import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC_K8OpaHkoSzha3pLI03Tu6sZ190p_z2o",
    authDomain: "medibridge-loginpage.firebaseapp.com",
    projectId: "medibridge-loginpage",
    storageBucket: "medibridge-loginpage.firebasestorage.app",
    messagingSenderId: "840197772490",
    appId: "1:840197772490:web:3522fefffe6414fc6ad033"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Handle form submission and sign-up logic
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('phone').value; // Can use phone number as password or use a separate password field
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User signed up successfully
            const user = userCredential.user;
            console.log('User created: ', user);

            // Optional: Store additional user details in Firestore
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).set({
                fullName: document.getElementById('full-name').value,
                phoneNumber: document.getElementById('phone').value
            })
            .then(() => {
                console.log("User info saved to Firestore!");
                window.location.href = '/dashboard'; // Redirect after successful signup
            })
            .catch((error) => {
                console.error("Error saving user info: ", error);
            });

        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage);  // Show the error message if signup fails
        });
});