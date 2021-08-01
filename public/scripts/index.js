document.addEventListener("DOMContentLoaded", function () {
  try {
    let app = firebase.app();

    var db = firebase.firestore(app);

    // Function to check whether the app is authenticated
    const checkApp = (adminStatus) => {
      var docref = db.collection("environment").doc("config");

      docref
        .get()
        .then(async (doc) => {
          if (doc.exists) {
            // Check if app is authenticated
            if (doc.data().appIsAuthenticated == true) {
              console.log("True Block: " + doc.data().appIsAuthenticated);
              return;
            } else {
              console.log("Else block: " + doc.data().appIsAuthenticated);
              //   Check if logged in user is admin
              if (adminStatus) {
                alert("Authenticate your app with Docusign");
                await axios
                  .get(
                    "http://localhost:5001/master-bruin-319711/us-central1/authenticator"
                  )
                  .then((response) => {
                    console.log(response.data.url);
                    window.location.replace(response.data.url);
                  });
              } else {
                alert(
                  "Please contact your system administrator to authenticate with Docusign"
                );
              }
            }
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error);
        });
    };

    // Function to check whether email is for admin
    const checkUser = (email_data) => {
      var docRef = db.collection("environment").doc("config");

      docRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            var isAdmin = false;
            if (doc.data().admin == email_data) {
              isAdmin = true;
              checkApp(isAdmin);
            } else {
              checkApp(isAdmin);
            }
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error);
        });
    };

    app.auth().onAuthStateChanged(async (user) => {
      if (user) {
        checkUser(user.email); //Check whether the email is for the admin
      } else {
        location.replace("/auth.html");
      }
    });
  } catch (e) {
    console.error(e);
  }
});
