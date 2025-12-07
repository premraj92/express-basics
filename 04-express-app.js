const express = require("express");
const path = require("path");
const app = express();

// sets up STATIC files & middleware
// express.static is a built-in middleware - used to serve static assets
// STATIC assets/files in the context of node/express are any files/resources that 
// the server doesn't need to change before serving it to the client
// these normally include css files, images & even javascript files
// While javascript may be considered DYNAMIC in the context of a browser
// where javascript provides handles all user interactions OR changes in app state
// For a server javascript also another file which can be served w/o any changes
// the CONVENTION is to keep all the Static files/assets inside a folder/directory called PUBLIC
app.use(express.static('public'))

app.get("/", (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, 'navbar-app/index.html'));
});

app.all("/{*any}", (req, res) => {
  res
    .status(404)
    .send(
      "<h1 style='font-family: cursive; font-size: 28px; color: red'>Resource not found</h1>"
    );
});

app.listen(5000, () => {
  console.log(`Our express app has started listening on port 5000 . . .`);
});
