document.addEventListener("DOMContentLoaded", async function () {
  await axios
    .get("http://localhost:5001/master-bruin-319711/us-central1/getToken")
    .then((response) => {
      response.data.status ? console.log("Success") : console.log("Failed");
    });
});
