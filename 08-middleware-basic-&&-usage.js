const express = require("express");
const app = express();

const logger = require('./logger')
const authorize = require('./authorize')

// What is a Middleware ?
// Middleware in the context of express are just functions that acts on every http request
// These middleware functions has access to both "request" & "response"
// Middleware's position/role in HTTP Cycle => Request ==> Middleware ==> Response
// i.e.Middleware starts acting on each request & perform some action before the response for that req is sent back

// Logger && Authorize are middleware functions
// we can pass these middleware functions as the second argument to our RequestHandler/Route methods like GET, POST, PUT etc
// i.e. it comes after the first path/url argument & before the 3rd argument of callback
// ANd these middlewares will be callback functions passed to request handler - means you don't have to instantiate it
// and both request & response objects will be passed as args to these middlewares by Express


// MIDDLEWARE functions == Function COMPOSITION approach == RxJS Operators
  // IMAGINE in a REAL WORLD scenario - we will be probably checking for JWT in queryParam/routeParam/Header
  // we will use that token && fetch the details of the authenticated user from Database
  // And then attach that user details to REQUEST OBJECT like below
  // I think this will be a more secure approach as this means users don't have to send their username/password everytime
  // But we can still add that details in our request object first thing once a http request reaches us
  // And in every subsequent stage of processing we will have that info available readily
  
  // Imagine this same steps for any other functionality/operation you have to do when a request reaches us
  // Its seems like we can compose a bunch of middleware functions to process/transform either our input request OR response
  // basically functional programming => function composition => where each middleware function behaves like RxJS operator
  // that can be used to either progressively transform either some data from request object OR some data from DB to send via resp
  // any checks/validations like authN/authZ & others can be done in by one or more middleware functions

// Middlewares classification based on source/who provides it 
// 1. Built in Express middlewares =>  express.static
// 2. Custom functions - created by us => logger, authorize
// 3. 3rd party packages from npm


// And when you use a middleware => 
// UNLESS you SEND back the RESPONSE from inside the middleware itself --
// YOU have TO PASS the CONTROL to the NEXT middleware Explicitly using next() 
// control won't pass automatically - like it does with a normal js function where even if you don't have a return keyword !!


// // If we utilize the .use() method as shown below to register a middleware --
// // the middleware will be automatiaclly at all stages if WE DON'T PROVIDE a PATH argument
// // Also if we use multiple middleware functions they will be executed/triggered in the same order we provide it inside the list
app.use([logger, authorize])

// // but in most cases we may pass a PATH argument before the middleware OR list of middlewares
// // If we pass that path, middleware will be triggered only for those routes that match the path
// // For ex: in this case, for all routes that starts with '/api' logger && authorize middlewares will be executed
// app.use('/api', [logger, authorize])

app.get("/", (req, res) => {
  console.log(`user info `, req.user)
  res.status(200).send(`<h1 style="font-family: cursive">Home Page</h1>`);
});

app.get("/about", (req, res) => {
  res.status(200).send(`<h1 style="font-family: cursive">About Page</h1>`);
});

app.get("/api/v1/products", (req, res) => {
  res.status(200).send(`<h1 style="font-family: cursive">Products Page</h1>`);
});

app.get("/api/v1/customers",(req, res) => {
  res.status(200).send(`<h1 style="font-family: cursive">Customers Page</h1>`);
});

app.listen(5000, () => {
  console.log(`Started listening on port 5000 . . .`);
});



// // If you look at the usage of the logger middleware below - MIDDLEWARE has TO BE ADDED to EVERY ROUTE/RequestHandler method
// // This Becomes very tedious in real world apps - as there may be hundreds of routes
// // And we may want to setup multiple Middlewares for a single route
// // So it becomes real cumbersome - real quick
// // What is the solution ?? => .use() method to the rescue - see the alternative middleware implemenation/usage above 

// // But using middlewares directly in the ROUTES is PERFECTLY FINE for cases - where you want to use them in only one or two --
// // -- specific routes 
// app.get("/", logger, (req, res) => {
//   console.log(`User has reached Home page`);
//   res.status(200).send(`<h1 style="font-family: cursive">Home Page</h1>`);
// });

// app.get("/about", logger ,(req, res) => {
//   console.log(`User has reached About page`);
//   res.status(200).send(`<h1 style="font-family: cursive">About Page</h1>`);
// });

// app.get("/api/v1/products", logger, (req, res) => {
//   console.log(`User has reached Products page`);
//   res.status(200).send(`<h1 style="font-family: cursive">Products Page</h1>`);
// });

// app.get("/api/v1/customers", logger ,(req, res) => {
//   console.log(`User has reached Customers page`);
//   res.status(200).send(`<h1 style="font-family: cursive">Customers Page</h1>`);
// });

// app.listen(5000, () => {
//   console.log(`Started listening on port 5000 . . .`);
// });
