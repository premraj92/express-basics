const express = require("express");

const expressApp = express();

// Express framework exposes the following major functions to quickly set up a server
// app.get
// app.post
// app.put
// app.delete
// app.all
// app.use
// app.listen

expressApp.get("/", (req, res) => {
  res
    .status(200)
    .send("<h1 style='font-family: cursive; font-size: 28px'>Home Page</h1>");
});

expressApp.get("/about", (req, res) => {
  res
    .status(200)
    .send("<h1 style='font-family: cursive; font-size: 28px'>About Page</h1>");
});

expressApp.all("/{*any}", (req, res) => {
  res
    .status(404)
    .send(
      "<h1 style='font-family: cursive; font-size: 28px; color: red'>Resource not found</h1>"
    );
});

expressApp.listen(5000, () => {
  console.log(`Our express app has started listening on port 5000 . . .`);
});
