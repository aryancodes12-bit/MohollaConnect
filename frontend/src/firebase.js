import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB3dFjN5CYQlQmbQedB4Ef6D_SLvxpGmzI",
  authDomain: "mohollaapp.firebaseapp.com",
  projectId: "mohollaapp",
  storageBucket: "mohollaapp.firebasestorage.app",
  messagingSenderId: "491672408082",
  appId: "1:491672408082:web:0235c8820732c7647d48cb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
