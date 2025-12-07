// AUTHORIZE MIDDLEWARE - Enhanced with Detailed Explanations
// ===========================================================

// AUTHORIZATION MIDDLEWARE PATTERN
// =================================
// This middleware demonstrates a common pattern:
// 1. Check if request is authorized (token, session, etc.)
// 2. If YES: Attach user info to req object & call next()
// 3. If NO: Send error response & DON'T call next()

const authorize = (req, res, next) => {
  console.log(`[Authorize] Checking authorization...`);

  // EXTRACTING DATA FROM REQUEST
  // ============================
  const { user } = req.query;
  // In this simple example, we check for ?user=name in URL
  // Example: http://localhost:5000/?user=john → user = 'john'
  //         http://localhost:5000/           → user = undefined

  // REAL-WORLD AUTHORIZATION FLOW
  // ==============================
  // In production, you'd typically:
  //
  // 1. Extract JWT token from header:
  //    const token = req.headers.authorization?.split(' ')[1]
  //    // Authorization: Bearer eyJhbGc.iOiJIUz... → token = 'eyJhbGc...'
  //
  // 2. Verify the token:
  //    try {
  //      const decoded = jwt.verify(token, process.env.JWT_SECRET)
  //      // decoded = { userId: 123, email: 'user@example.com', iat: 1234567 }
  //    } catch (err) {
  //      return res.status(401).json({ error: 'Invalid token' })
  //    }
  //
  // 3. Fetch full user details from database:
  //    const user = await User.findById(decoded.userId)
  //    if (!user) {
  //      return res.status(401).json({ error: 'User not found' })
  //    }
  //
  // 4. Attach to request object:
  //    req.user = user
  //
  // 5. Proceed to next middleware:
  //    next()

  // AUTHORIZATION CHECK
  // ===================
  if (user) {
    // SUCCESS CASE: User is authorized
    
    // MODIFYING THE REQUEST OBJECT
    // ============================
    // This is a KEY middleware capability - we can ADD properties to req
    // Now ALL downstream middleware and route handlers can access req.user
    req.user = { name: user, id: 3 };
    
    console.log(`[Authorize] User '${user}' authorized`);
    
    // Pass control to next middleware/route handler
    next();
    
    // CRITICAL CORRECTION: WHY return IS NEEDED
    // =========================================
    // You discovered this needs 'return' but let's clarify WHY:
    //
    // next() is just a FUNCTION CALL - it triggers the next middleware
    // but it DOES NOT stop THIS function's execution!
    //
    // Without return:
    // 1. next() is called → next middleware starts
    // 2. Execution continues in THIS function
    // 3. Line 71 executes → res.status(401).send()
    // 4. Now we've sent TWO responses → ERROR!
    //
    // The error: "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client"
    //
    // With return:
    // 1. next() is called → next middleware starts
    // 2. return exits THIS function immediately
    // 3. Line 71 never executes ✓
    //
    // KEY INSIGHT: next() moves control forward in the middleware chain
    //              return stops execution in the current function
    //              They serve DIFFERENT purposes!
    
    return; // ← CRITICAL! Exit this function to prevent line 71 from executing
  }
  
  // FAILURE CASE: User is NOT authorized
  // =====================================
  console.log(`[Authorize] No user found - sending 401`);
  
  // Send 401 Unauthorized response
  res.status(401).send(`
    <h1 style="font-family: cursive; color: red">
      Unauthorized Access
    </h1>
    <p>Please provide a valid user parameter. Example: ?user=yourname</p>
  `);
  
  // IMPORTANT: We DON'T call next() here!
  // ======================================
  // By not calling next(), we END the request-response cycle here
  // The request never reaches the route handler
  //
  // Flow with authorized user:
  // Request → logger → authorize → next() → route handler → Response
  //
  // Flow with unauthorized user:
  // Request → logger → authorize → res.send(401) → Response
  //                                 ↑ Chain stops here
  
  // Note: 'return' here is technically optional (it's the last line)
  // But it's good practice for consistency and clarity
  return;
};

// MIDDLEWARE AS FUNCTION COMPOSITION
// ===================================
// Your RxJS analogy is spot-on! Here's the detailed mapping:
//
// In RxJS, you compose operators to transform a stream:
// source$
//   .pipe(
//     tap(log),           // Side effect - doesn't transform data
//     map(addMetadata),   // Transform - adds properties
//     filter(isValid),    // Conditional - only pass if true
//     switchMap(fetchDB)  // Async - wait for completion
//   )
//
// In Express, middleware compose to transform req/res:
// Request
//   → logger           // Side effect - log but don't modify
//   → authorize        // Transform - add req.user property
//   → validate         // Conditional - continue or send error
//   → async handler    // Async - fetch data and respond
//
// Both enable:
// - Separation of concerns (each function has ONE job)
// - Reusability (use logger on all routes)
// - Testability (test authorize in isolation)
// - Composability (mix and match middleware)

// COMMON MIDDLEWARE PATTERNS
// ==========================
//
// 1. AUTHENTICATION (verify identity):
//    - Check if user is logged in
//    - Validate token/session
//    - Add req.user if valid
//    - Send 401 if invalid
//
// 2. AUTHORIZATION (verify permissions):
//    - Check if user has required role/permission
//    - Access req.user (set by authentication middleware)
//    - Send 403 Forbidden if insufficient permissions
//
// 3. VALIDATION (verify input):
//    - Check req.body, req.params, req.query
//    - Validate format, type, required fields
//    - Send 400 Bad Request if invalid
//
// 4. TRANSFORMATION (modify data):
//    - Parse/format request data
//    - Add computed properties
//    - Sanitize input
//
// 5. LOGGING/MONITORING (observe):
//    - Log requests/responses
//    - Track metrics
//    - Send to monitoring services

// MIDDLEWARE FACTORY PATTERN (Advanced)
// ======================================
// Sometimes you want configurable middleware:
//
// const authorize = (options = {}) => {
//   return (req, res, next) => {
//     const token = req.headers[options.headerName || 'authorization']
//     
//     if (!token) {
//       return res.status(401).json({ error: options.errorMessage || 'Unauthorized' })
//     }
//     
//     // Verify token...
//     next()
//   }
// }
//
// Usage:
// app.use(authorize({ headerName: 'x-api-key', errorMessage: 'Invalid API key' }))

module.exports = authorize;
