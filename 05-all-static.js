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


// As per above definition of STATIC files - index.html can also be considered a static asset
// So instead of using the sendFile to send the index.html I have added the index.html as well
// in public folder
// And express will automatically serve index.html as well
// app.get("/", (req, res) => {
//   res.status(200).sendFile(path.resolve(__dirname, 'navbar-app/index.html'));
// });
// The other OPTION we will have is to use SSR(Server Side Rendering/Template Engine) - 
// incase if we want to change the content of
// index.html dynamically at the time when server serves it - maybe based on some
// user input in the request

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
