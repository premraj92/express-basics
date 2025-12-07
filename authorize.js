// As mentioned before every function that acts/used as middleware is provided with these args - req, res, next by
// express automatiaclly
// Also as mentioned before you have to definitely use next() to pass control forward to the next middleware
// OR call res.send() from within the middleware
const authorize = (req, res, next) => {
  console.log(`Authorize middleware called`);

  const { user, id } = req.query;

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
  if (user) {
    req.user = { name: user, id: 3 };
    next();

    // Here return statement may not be required - as the res.status(401).send() won't be executed as this middleware control/execution
    // will be trasfered out as soon next() statement is called ??

    // NOPE here also RETURN is required even with next() call
    return
  }
  
  res.status(401).send(`<h1 style="font-family: cursive; color: red">You are not authorized to access this resource</h1>`)
};

module.exports = authorize;
