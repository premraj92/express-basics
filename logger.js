// Logger is a middleware function
// we can pass these middleware functions as the second argument to our RequestHandler methods like GET, POST, PUT etc
// i.e. it comes after the first path/url argument & before the 3rd argument of callback
// ANd these middlewares will be callback functions passed to request handler - means you don't have to instantiate it
// and both request & response objects will be passed as args to these middlewares by Express

// And when you use a middleware => 
// UNLESS you SEND back the RESPONSE from inside the middleware itself --
// YOU have TO PASS the CONTROL to the NEXT middleware Explicitly using next() 
// control won't pass automatically - like it does with a normal js function where even if you don't have a return keyword !!
const logger = (req, res, next) => {
  const method = req.method;
  const url = req.url;
  const currTime = new Date().getFullYear();
  console.log(method, url, currTime);

  // passing the control onto the NEXT middleware
  next()
};

module.exports = logger