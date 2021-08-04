document.addEventListener("DOMContentLoaded", function () {
  try {
    let app = firebase.app();

    app.auth().onAuthStateChanged((user) => {
      if (user) {
        location.replace("/");
      } else {
        var ui = new firebaseui.auth.AuthUI(app.auth());

        ui.start("#firebase-auth-container", {
          signInOptions: [
            firebase.auth.EmailAuthProvider.PROVIDER_ID
          ],
          signInSuccessUrl: "/",
        });
      }
    });
  } catch (e) {
    console.error(e);
    // loadEl.textContent = "Error loading the Firebase SDK, check the console.";
  }
});
