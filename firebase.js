import firebase from "firebase/app";

import "firebase/analytics";

import "firebase/auth";
import "firebase/firestore"

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLyYf-TRq6_fsSXS8iVhArVRDWwUlZAMI",
  authDomain: "master-bruin-319711.firebaseapp.com",
  projectId: "master-bruin-319711",
  storageBucket: "master-bruin-319711.appspot.com",
  messagingSenderId: "967401261842",
  appId: "1:967401261842:web:7a61fe7676fbb82a8281cb",
  measurementId: "G-JXC1WZ4S18"
};

let app;

if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig)
} else {
  app = firebase.app();
}

const db = app.firestore();
const auth = firebase.auth();

export { auth, db };