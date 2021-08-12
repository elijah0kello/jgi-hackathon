document.addEventListener("DOMContentLoaded", async function () {
  await axios
    .get("https://us-central1-master-bruin-319711.cloudfunctions.net/getToken")
    .then((response) => {
      response.data.status ? console.log("Success") : console.log("Failed");
    });
});
