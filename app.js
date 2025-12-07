const express = require("express");
const app = express();

const peopleRoute = require("./routes/people");
const authRoute = require("./routes/auth");


// ALL these methods - express.static() && express.urlencoded() && express.json() are Built-IN Express Middleware functions

// serve static assets
app.use(express.static("./methods-public"));

// parse form data from request payload
app.use(express.urlencoded({ extended: false }));

// parse json data from request payload
app.use(express.json());

app.use("/api/people", peopleRoute);
app.use("/login", authRoute);

app.listen(5000, () => {
  console.log(`Server started listening at port 5000 . . .`);
});
