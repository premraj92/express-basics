// LOGGER MIDDLEWARE - Enhanced with Detailed Explanations
// ========================================================

// MIDDLEWARE FUNCTION SIGNATURE
// ==============================
// Every middleware receives exactly 3 arguments from Express:
// 1. req  - Request object (contains URL, headers, params, query, body, etc.)
// 2. res  - Response object (methods: send(), json(), status(), etc.)
// 3. next - Function to pass control to next middleware in the chain
//
// You don't call this function yourself - Express calls it automatically
// when a request matches the route/path where this middleware is registered

const logger = (req, res, next) => {
  // ACCESSING REQUEST PROPERTIES
  // =============================
  const method = req.method;  // HTTP method: GET, POST, PUT, DELETE, PATCH, etc.
  const url = req.url;        // Full URL path including query string
                              // Example: /api/users?page=1 → url = '/api/users?page=1'
  
  const time = new Date().getFullYear(); // Current timestamp
  
  console.log(`[${time}] ${method} ${url}`);
  
  // USEFUL REQ PROPERTIES YOU CAN ACCESS:
  // req.path        → Just the path without query: '/api/users'
  // req.query       → Query params as object: { page: '1' }
  // req.params      → Route params: { id: '123' } from /users/:id
  // req.headers     → HTTP headers: { 'content-type': 'application/json' }
  // req.body        → Request body (needs express.json() middleware first)
  // req.ip          → Client IP address
  // req.hostname    → Host name from header

  // THE CRITICAL next() CALL
  // ========================
  // This passes control to the next middleware or route handler
  // WITHOUT this call, the request will HANG forever (never get a response)
  //
  // Think of middleware as a chain of functions:
  // Request → logger → authorize → route handler → Response
  //           ↑ you are here
  //           next() moves to authorize →
  
  next()
  
  // IMPORTANT: Code here STILL EXECUTES after next() is called!
  // next() is just a function call, not a return statement
  // If you want to stop execution here, add 'return' after next():
  // next()
  // return
  
  // This would execute:
  // console.log('This runs AFTER next middleware finishes!')
};

// WHY IS THIS USEFUL?
// ===================
// 1. Debugging: See all requests hitting your server
// 2. Monitoring: Track which endpoints are being used
// 3. Performance: Can add timing logic (measure response time)
// 4. Audit trail: Log who accessed what and when
//
// REAL-WORLD ENHANCEMENT:
// const logger = (req, res, next) => {
//   const start = Date.now()
//   
//   // Wait for response to finish
//   res.on('finish', () => {
//     const duration = Date.now() - start
//     console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`)
//   })
//   
//   next()
// }

module.exports = logger
