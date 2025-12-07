const express = require("express");
const app = express();

const logger = require('./logger-explained')
const authorize = require('./authorize-explained')

// WHAT IS MIDDLEWARE?
// ===================
// Middleware are functions that execute DURING the request-response cycle.
// They have access to: req (request), res (response), next (function to pass control)
//
// Flow: REQUEST → Middleware1 → Middleware2 → ... → Route Handler → RESPONSE
//
// Middleware can:
// 1. Execute any code (logging, validation, auth checks, data transformation)
// 2. Modify req/res objects (add properties like req.user, parse req.body)
// 3. End request-response cycle early (send response before reaching route handler)
// 4. Call next middleware in the stack (using next())

// KEY CORRECTION: "Acts on every request"
// ========================================
// Middleware doesn't ALWAYS act on every request - it depends on HOW and WHERE it's registered:
//
// app.use(logger)              → Runs for ALL requests (all methods, all paths)
// app.use('/api', logger)      → Runs only for paths starting with /api
// app.get('/users', logger, fn) → Runs only for GET requests to /users
//
// More accurate definition:
// "Middleware are functions that process requests BEFORE they reach route handlers.
//  They can be applied globally, to specific paths, or to individual routes."

// MIDDLEWARE TYPES (by source)
// ============================
// 1. Built-in Express middleware:
//    - express.json()              → Parses JSON request bodies into req.body
//    - express.urlencoded()        → Parses form data into req.body
//    - express.static('public')    → Serves static files from directory
//
// 2. Custom middleware (created by us):
//    - logger, authorize (see imported files)
//
// 3. Third-party middleware (from npm):
//    - cors              → Handle Cross-Origin Resource Sharing
//    - helmet            → Security headers
//    - morgan            → HTTP request logger
//    - multer            → File upload handling

// MIDDLEWARE SIGNATURE
// ====================
// Regular middleware: (req, res, next) => { ... }   ← 3 parameters
// Error middleware:   (err, req, res, next) => { ... }  ← 4 parameters (err first!)
//
// The number of parameters matters! Express identifies error middleware by the 4-param signature.

// CRITICAL CONCEPT: next() DOES NOT STOP EXECUTION!
// ==================================================
// This is THE most important thing to understand about middleware.
//
// next() is just a function call that triggers the next middleware.
// It DOES NOT work like 'return' - code after next() will STILL EXECUTE!
//
// Example of the problem:
// if (user) {
//   req.user = user;
//   next();        // ← Calls next middleware BUT continues to line below
//   // Without return, code keeps executing...
// }
// res.send('Unauthorized') // ← This STILL runs! Causes "headers already sent" error
//
// ALWAYS pair next() or res.send() with return:
// if (user) {
//   req.user = user;
//   next();
//   return;  // ← CRITICAL! Stops THIS function's execution
// }
// res.send('Unauthorized') // Now this won't run

// APPLYING MIDDLEWARE - Multiple Ways
// ====================================

// Method 1: Global middleware (runs for ALL requests, all methods)
// This is what we're using below - logger and authorize run on every single request
app.use([logger, authorize])

// Method 2: Path-specific middleware (runs for all methods under a path)
// Uncomment to see - only /api routes would run logger and authorize
// app.use('/api', [logger, authorize])

// Method 3: Route-specific middleware (runs only for that specific route)
// Uncomment the alternative implementation at the bottom to see this

// Method 4: Multiple middleware in route definition
// app.get('/users', middleware1, middleware2, middleware3, (req, res) => {...})
// OR
// app.get('/users', [middleware1, middleware2], middleware3, (req, res) => {...})

// EXECUTION ORDER IS CRITICAL!
// ============================
// Middleware executes in the EXACT order they're registered (top to bottom in file)
// Think of it as a chain or pipeline:
//
// Request → app.use(logger) → app.use(authorize) → app.get('/') → Response
//
// Common mistake: Putting 404 handler before routes
// app.use(notFoundHandler)  ← Would catch everything!
// app.get('/users', ...)    ← Never reached
//
// Correct order:
// app.use(globalMiddleware)
// app.get('/route1', ...)
// app.get('/route2', ...)
// app.use(notFoundHandler)  ← Last!

app.get("/", (req, res) => {
  // req.user was added by authorize middleware
  console.log(`User info attached by middleware:`, req.user)
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

// ERROR HANDLING MIDDLEWARE (4 parameters!)
// ==========================================
// This special middleware catches errors passed via next(error)
// MUST be registered AFTER all routes
// Express recognizes it by the 4-parameter signature
app.use((err, req, res, next) => {
  console.error('Error caught by error handler:', err.message)
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  })
})

// 404 HANDLER (catches unmatched routes)
// ======================================
// This should be the LAST middleware (after all routes and error handler)
app.use((req, res) => {
  res.status(404).send(`<h1 style="font-family: cursive; color: red">404 - Resource not found</h1>`);
});

app.listen(5000, () => {
  console.log(`Server listening on port 5000`);
  console.log(`\nTest URLs:`);
  console.log(`- http://localhost:5000/?user=john (authorized)`);
  console.log(`- http://localhost:5000/ (unauthorized - no user query param)`);
  console.log(`- http://localhost:5000/about?user=jane`);
  console.log(`- http://localhost:5000/api/v1/products?user=bob`);
});

// FUNCTION COMPOSITION ANALOGY (Your RxJS comparison)
// ====================================================
// Your RxJS operators analogy is EXCELLENT! Here's how they map:
//
// RxJS Observable Pipeline:
// request$.pipe(
//   tap(logRequest),      // Side effect (logging)
//   map(authenticate),    // Transform data (add user)
//   filter(authorize),    // Conditional flow (check permissions)
//   switchMap(fetchData), // Async operation
//   map(formatResponse)   // Transform output
// )
//
// Express Middleware Chain:
// app.use(logger)         // Like tap() - side effect, doesn't transform
// app.use(authenticate)   // Like map() - adds req.user
// app.use(authorize)      // Like filter() - blocks unauthorized
// app.get('/data',        // Like switchMap() - async DB fetch
//   async (req, res) => {
//     const data = await fetchFromDB()
//     res.json(formatResponse(data)) // Like final map()
//   }
// )
//
// Both patterns:
// - Compose small, focused functions
// - Pass data through a pipeline
// - Can short-circuit (RxJS: throwError, Express: send response early)
// - Enable separation of concerns (logging, auth, business logic)

// ALTERNATIVE: Route-Specific Middleware
// =======================================
// Uncomment this section to see how middleware can be applied per-route
// This is useful when you need middleware only for specific endpoints

// app.get("/", logger, authorize, (req, res) => {
//   console.log(`User info:`, req.user);
//   res.status(200).send(`<h1 style="font-family: cursive">Home Page</h1>`);
// });

// app.get("/about", logger, authorize, (req, res) => {
//   res.status(200).send(`<h1 style="font-family: cursive">About Page</h1>`);
// });

// app.get("/api/v1/products", logger, authorize, (req, res) => {
//   res.status(200).send(`<h1 style="font-family: cursive">Products Page</h1>`);
// });

// app.get("/api/v1/customers", logger, authorize, (req, res) => {
//   res.status(200).send(`<h1 style="font-family: cursive">Customers Page</h1>`);
// });

// PROS of route-specific middleware:
// - Fine-grained control (only apply where needed)
// - Easier to see dependencies for each route
//
// CONS:
// - Repetitive if applied to many routes
// - Easy to forget on new routes
// - Harder to maintain (change requires updating all routes)
//
// BEST PRACTICE:
// - Use app.use() for middleware needed on most/all routes (logging, parsing)
// - Use route-specific for middleware needed on few specific routes (special auth, rate limiting)
