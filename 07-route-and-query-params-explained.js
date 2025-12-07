const express = require("express");
const app = express();
const { products } = require("./data");

app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      `<h1 style='font-family: cursive; font-size: 36px;'>Home page</h1> <a href="/api/products">products</a>`
    );
});

// Send all Products - basic info only
app.get("/api/products", (req, res) => {
  const basicProductInfoList = products.map((product) => {
    const { id, name, image } = product;
    return { id, name, image };
  });

  res.status(200).json(basicProductInfoList);
});

// ROUTE PARAMS - Understanding Type Safety
// ==========================================
// KEY INSIGHT #1: req.params values are ALWAYS strings, no matter what user sends
// URL: /api/products/123  → req.params.productId = "123" (string)
// URL: /api/products/abc  → req.params.productId = "abc" (string)
// URL: /api/products/1.5  → req.params.productId = "1.5" (string)
//
// KEY INSIGHT #2: We MUST validate and convert before using them in comparisons
// This is critical because product.id is a number, but req.params.productId is always a string
//
// KEY INSIGHT #3: Different status codes mean different things:
// - 400 Bad Request: Client sent invalid/malformed data (e.g., "abc" when we need a number)
// - 404 Not Found: The resource doesn't exist (e.g., product ID 9999)
// - 200 OK: Request succeeded
app.get("/api/products/:productId", (req, res) => {
  const productIdString = req.params.productId; // Always a string!

  // Step 1: Try to convert to number
  const productIdNumber = Number(productIdString);

  // Step 2: Check if conversion produced a valid number
  // Number("abc") → NaN (Not a Number)
  // Number("123") → 123 (valid)
  // Number("1.5") → 1.5 (valid number, but might not match any product)
  // Number("")    → 0 (edge case!)
  if (isNaN(productIdNumber)) {
    // This is a 400 Bad Request - client sent invalid data format
    // We're being helpful by explaining what went wrong
    res.status(400).json({
      error: "Invalid product ID. Must be a number.",
      received: productIdString,
    });
    return; // CRITICAL: Must return to prevent further execution
  }

  // Step 3: Now we can safely search using the converted number
  const selectedProductInfo = products.find(
    (product) => product.id === productIdNumber
  );

  // Step 4: Handle case where product doesn't exist
  if (selectedProductInfo == null) {
    // This is a 404 Not Found - the resource doesn't exist
    // The request format was correct (valid number), but that ID has no product
    res.status(404).json({
      error: "Product not found",
      searchedId: productIdNumber,
    });
    return;
  }

  // Step 5: Success! Return the product
  res.status(200).json(selectedProductInfo);
});

// MULTIPLE ROUTE PARAMS - Understanding Structure
// ================================================
// You can have as many route params as needed in a single route
// They all end up in req.params as an object with key-value pairs
//
// Example URL: /api/products/5/userPreferences/10/reviews/3
// Results in req.params: { productId: "5", userPreferenceId: "10", reviewId: "3" }
//
// IMPORTANT: The parameter names (:productId, :userPreferenceId, :reviewId) 
// become the keys in req.params object
//
// Route structure order matters:
// /api/products/:productId/userPreferences/:userPreferenceId/reviews/:reviewId
// ↑ fixed      ↑ variable  ↑ fixed             ↑ variable       ↑ fixed  ↑ variable
//
// The fixed parts must match exactly, variable parts can be anything
app.get(
  "/api/products/:productId/userPreferences/:userPreferenceId/reviews/:reviewId",
  (req, res) => {
    console.log("All route params received:", req.params);

    // Destructure for cleaner code
    const { productId, userPreferenceId, reviewId } = req.params;

    // REMEMBER: All three are strings! 
    // In a real app, you would validate each one (like we did above)
    // before using them to query a database

    res.status(200).json({
      message: "Successfully processed all your route params",
      params: req.params,
      note: "In real app, these would be validated and used to fetch data",
    });
  }
);

// QUERY PARAMS - Understanding Optional Filtering
// ================================================
// Query params are added after ? in URL and are ALWAYS OPTIONAL
// Format: ?key1=value1&key2=value2&key3=value3
//
// Example URLs and their req.query values:
// /api/v1/query                          → {}
// /api/v1/query?search=chair             → { search: "chair" }
// /api/v1/query?search=chair&limit=5     → { search: "chair", limit: "5" }
// /api/v1/query?search=                  → { search: "" } (empty string!)
// /api/v1/query?limit=-10                → { limit: "-10" } (negative as string!)
// /api/v1/query?search=a&search=b        → { search: ["a", "b"] } (array if repeated!)
//
// KEY INSIGHT: Query param values are also strings (or undefined if not provided)
// They're never automatically converted to numbers, booleans, etc.
//
// DESIGN DECISION: Since query params are optional, we need to decide:
// - What happens if they're not provided? (return all data)
// - What happens if they're invalid? (ignore them? return error?)
// - Should search be case-sensitive? (usually no)
app.get("/api/v1/query", (req, res) => {
  console.log("Received query params:", req.query);

  // Start with full list - default behavior when no filters applied
  let searchableProducts = [...products];

  // Destructure the query params we care about
  // Any other query params sent by user will be ignored
  const { search, limit } = req.query;

  // FILTERING BY SEARCH
  // ====================
  // Check if search param was provided
  // Note: search could be undefined (not provided) or "" (empty string)
  // Both are falsy, so this if statement handles both cases
  if (search) {
    // DESIGN CHOICE: Case-insensitive search is more user-friendly
    // User searching "CHAIR" should find "wooden chair"
    const searchTerm = search.toLowerCase();

    searchableProducts = searchableProducts.filter((product) => {
      // Convert product name to lowercase too for comparison
      return product.name.toLowerCase().includes(searchTerm);
    });

    // ALTERNATIVE: Case-sensitive search (simpler but less user-friendly):
    // searchableProducts = searchableProducts.filter((product) =>
    //   product.name.includes(search)
    // );
  }

  // LIMITING RESULTS
  // ================
  // limit is either undefined (not provided) or a string like "5"
  // We need to validate it's a positive integer
  if (limit) {
    // Step 1: Convert string to number
    const limitNumber = Number(limit);

    // Step 2: Validate it's a valid positive integer
    // Number("-5") → -5 (valid number but negative)
    // Number("5.5") → 5.5 (valid number but not integer)
    // Number("abc") → NaN (not a number)
    if (!isNaN(limitNumber) && limitNumber > 0) {
      // slice(0, 5) returns first 5 items
      // If limit > array length, slice returns all items (no error)
      searchableProducts = searchableProducts.slice(0, limitNumber);
    }
    // DESIGN CHOICE: If limit is invalid, we ignore it rather than returning error
    // This makes the API more forgiving
  }

  // HANDLING EMPTY RESULTS
  // ======================
  // Two scenarios can lead to empty results:
  // 1. User provided search term but no products matched
  // 2. User provided limit=0 (edge case)
  //
  // We still return 200 OK because:
  // - The request was properly formatted
  // - The search/filter was successfully executed
  // - It's not an error that no results matched
  if (searchableProducts.length < 1) {
    res.status(200).json({
      success: true,
      message: "No products matched your search criteria",
      data: [],
    });
    return; // CRITICAL: Must return to prevent executing code below
  }

  // Return filtered/limited results
  res.status(200).json({
    success: true,
    count: searchableProducts.length,
    data: searchableProducts,
  });

  // IMPORTANT CONCEPT: You CANNOT call res.send() or res.json() twice
  // in the same request handler. HTTP protocol allows only ONE response per request.
  //
  // If you forget to return after sending a response, and another res.json()
  // executes, Express throws: "Error: Cannot set headers after they are sent"
  //
  // This is similar to how you can't use res.end() twice in core Node.js HTTP
  //
  // Think of it like a postcard - once you mail it, you can't add more text!
});

// About page
app.get("/about", (req, res) => {
  res
    .status(200)
    .send(`<h1 style='font-family: cursive; font-size: 36px;'>About page</h1>`);
});

// 404 HANDLER - Catch All Unmatched Routes
// =========================================
// CRITICAL CONCEPT: Route order matters in Express!
// Express matches routes from TOP to BOTTOM
// This 404 handler MUST be defined AFTER all other routes
// If it was first, it would catch everything and your other routes would never run
//
// app.use() vs app.get()/app.post()/app.all():
// - app.get("/path", ...) only matches GET requests to /path
// - app.all("/path", ...) matches ANY method (GET, POST, etc.) to /path
// - app.use(...) is middleware that runs for ANY method and ANY unmatched path
//
// Why app.use() is better for 404s:
// - No need to specify a path (defaults to matching everything)
// - Only runs if no previous route matched
// - Clean and idiomatic Express pattern
//
// INCORRECT SYNTAX (from your original code):
// app.all("/{*any}", ...) // ❌ Invalid! Express doesn't use {*any} syntax
//
// CORRECT OPTIONS:
// Option 1: app.all("*", ...) // Works but not idiomatic
// Option 2: app.use(...)      // ✅ Best practice for 404 handlers
app.use((req, res) => {
  // req.method tells you if it was GET, POST, PUT, DELETE, etc.
  // req.path or req.url tells you what path they tried to access
  console.log(`404 - ${req.method} ${req.path} not found`);

  res
    .status(404)
    .send(
      `<h1 style='font-family: cursive; font-size: 28px; color: red'>Resource not found</h1>`
    );
});

// Express server setup
app.listen(5000, () => {
  console.log(`Server listening at http://localhost:5000`);
  console.log(`\nTry these URLs to test your understanding:`);
  console.log(`- http://localhost:5000/api/products`);
  console.log(`- http://localhost:5000/api/products/1`);
  console.log(`- http://localhost:5000/api/products/abc (what error?)`);
  console.log(`- http://localhost:5000/api/v1/query?search=wooden`);
  console.log(`- http://localhost:5000/api/v1/query?search=WOODEN (case test)`);
  console.log(`- http://localhost:5000/api/v1/query?search=xyz&limit=2`);
  console.log(`- http://localhost:5000/api/v1/query?limit=-5 (what happens?)`);
});
