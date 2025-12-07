# Route & Query Params - Conceptual Understanding

## 🎯 Test Your Understanding

After reading the explained version, try to answer these questions **before** testing:

### Route Params Questions

1. **Type Coercion**: 
   - What is `req.params.productId` when URL is `/api/products/123`? 
      productId = 123
   - What about `/api/products/abc`?
      productId = abc
   - Why does `product.id === req.params.productId` fail?
      because product.id may be in most cases like ours - be a number, but routeParm values are strings
2. **Validation**:
   - What's the difference between 400 and 404 status codes?
      400 says that the user has screwed up the request inputs i.e. eheir route/queryParams OR body/payload && that they should send proper/valid input

      404 says - there are no issues with the user's request input, but rather the resource they requested itself is missing

   - When should you return 400 vs 404?
      400 - when user request input is invalid
      404 - when request resource(url itself or data) is not found
3. **Route Order**:
   ```js
   app.get("/api/products/:productId", ...)
   app.get("/api/products/featured", ...)
   ```
   - Can you access `/api/products/featured`? Why/why not?
   The less specific(i.e. one level up in the route) url/route always matches a partial path of more specific route 
   - How would you fix it?
   You have to add/listen to more specific roues/urls before the less specific ones in the file 

4. **Multiple Params**:
   - Given `/api/products/:id/reviews/:reviewId`, what does `req.params` look like for `/api/products/5/reviews/10`?
   req.params === {id: 5, reviewId: 10}

### Query Params Questions

1. **Type & Optionality**:
   - What is `req.query.limit` when URL is `/api/v1/query?limit=5`?
    req.query.limit = '5'
   - What about `/api/v1/query` (no query params)?
   req.query = {} && req.query.limit = undefined
   - What about `/api/v1/query?limit=`?
   Not sure => undefined/null ?
   
   **✅ Clarification**: It's `""` (empty string)!
   ```js
   // URL: /api/v1/query?limit=
   req.query.limit // → "" (empty string, NOT undefined)
   
   // URL: /api/v1/query (no limit param at all)
   req.query.limit // → undefined
   ```
   **Key insight**: If the query param key is present in URL but has no value, it becomes an empty string. If the key is not in the URL at all, it's undefined.

2. **Edge Cases**:
   ```js
   // URL: /api/v1/query?search=Chair
   product.name.includes(req.query.search)
   ```
   - Will this find "wooden chair"? Why/why not?
   is it case insensitive search ?
   - Will it find "CHAIR"? Why/why not?y
   
   **✅ Clarification**: `.includes()` is **case-sensitive by default**!
   ```js
   // URL: /api/v1/query?search=Chair
   "wooden chair".includes("Chair") // → false (capital C doesn't match lowercase c)
   "Wooden Chair".includes("Chair") // → true (exact match)
   "CHAIR".includes("Chair")        // → false (all caps doesn't match)
   ```
   
   **To make it case-insensitive**:
   ```js
   const searchTerm = req.query.search.toLowerCase();
   products.filter(p => p.name.toLowerCase().includes(searchTerm))
   // Now "Chair", "CHAIR", "chair" all match "wooden chair"
   ```

3. **Array Values**:
   - What is `req.query.id` when URL is `/api?id=1&id=2&id=3`?
   req.query.id = ['1','2','3']
   - How would you handle this in your code?
   filterOut records that match those Ids

4. **Validation**:
   - User sends `/api/v1/query?limit=-5`. What should happen?
   - User sends `/api/v1/query?limit=abc`. What should happen?
   - Should these return errors or just be ignored?
   I think for both I can return a custom msg like products not required => with 200 or 404 ?
   
   **✅ Clarification**: Best practice is to **ignore invalid values** (not error)!
   ```js
   const limitNumber = Number(req.query.limit);
   if (!isNaN(limitNumber) && limitNumber > 0) {
     // Only apply limit if it's valid
     products = products.slice(0, limitNumber);
   }
   // If invalid, just ignore and return all products
   ```
   
   **Why ignore instead of returning 400 error?**
   - Query params are **optional** by nature
   - More forgiving UX - user still gets useful data
   - Invalid optional params shouldn't break the entire request
   - Still return 200 with all products (or with other valid filters applied)
   
   **Design spectrum**:
   - **Strict**: Return 400 error → Less common, use when param is critical
   - **Forgiving**: Ignore invalid, use defaults → ✅ Most common for optional params
   - **Coercing**: Try to fix (e.g., `Math.abs(-5)` → `5`) → Sometimes useful
   
   **When to use 400**: If the param was **required** but invalid, or if the entire request is malformed.

### HTTP Concepts

1. **Response Handling**:
   ```js
   if (products.length === 0) {
     res.status(200).json({ data: [] });
   }
   res.status(200).json(products);
   ```
   - What's wrong with this code?
   - What error will Express throw?
   res.status(200).json(products); - this line is executed after already response is returned
   so express will throw an Header can be set after . .

2. **Status Codes**:
   - 200: When to use?
   when reqest & request input is valid && returning an successful response
   - 400: When to use?
   when request input from user is invalid
   - 404: When to use?
   When the resource/route itself doesn't exist OR when a specific identified resource is not found
   - Can you return 200 with empty data?
   Not sure ?
   
   **✅ Clarification**: **Yes! 200 with empty data is perfectly valid and common!**
   ```js
   // URL: /api/v1/query?search=nonexistent
   res.status(200).json({ success: true, data: [] }) // ✅ Correct!
   ```
   
   **Why 200 and not 404?**
   - The **request was valid** (proper format, proper execution)
   - The **endpoint exists** (`/api/v1/query` is a valid route)
   - **No matches** is a valid outcome, not an error
   - Think: Google search with 0 results is still "200 OK", not "404 Not Found"
   
   **When to use 404**:
   - The **route/endpoint itself** doesn't exist: `GET /api/doesnotexist` → 404
   - A **specific identified resource** doesn't exist: `GET /api/products/9999` → 404
   - **NOT for** search/filter with no results: `GET /api/products?search=xyz` → 200 with empty array
   
   **Rule of thumb**:
   - User asks for specific thing by ID → doesn't exist → **404**
   - User searches/filters → no matches → **200 with empty data**

3. **Wildcard Routes**:
   ```js
   app.use((req, res) => { ... }) // 404 handler
   app.get("/about", (req, res) => { ... })
   ```
   - Will `/about` ever be reached? Why/why not?
   `/about` will not be reached - if app.use((req, res) => { ... }) handles wild cards
   because wild cards is positioned before (`/about`) will match with everything 

## 🧪 Practical Tests

Run `node 07-route-and-query-params-explained.js` and test these:

### Route Params Tests
```bash
# Should work (200 OK)
curl http://localhost:5000/api/products/1

# Should fail with 400 (invalid format)
curl http://localhost:5000/api/products/abc

# Should fail with 404 (valid format, but doesn't exist)
curl http://localhost:5000/api/products/9999

# Should work (200 OK)
curl http://localhost:5000/api/products/1/userPreferences/10/reviews/3
```

### Query Params Tests
```bash
# No filters - returns all
curl http://localhost:5000/api/v1/query

# Case-insensitive search
curl "http://localhost:5000/api/v1/query?search=wooden"
curl "http://localhost:5000/api/v1/query?search=WOODEN"  # Should give same result

# Limit results
curl "http://localhost:5000/api/v1/query?limit=2"

# Combined filters
curl "http://localhost:5000/api/v1/query?search=chair&limit=1"

# Edge cases
curl "http://localhost:5000/api/v1/query?limit=-5"      # Should ignore
curl "http://localhost:5000/api/v1/query?limit=abc"     # Should ignore
curl "http://localhost:5000/api/v1/query?search=zzz"    # Should return empty array
```

## 📚 Key Concepts Summary

### 1. Type Safety
- **ALL** `req.params` values are strings
- **ALL** `req.query` values are strings (or undefined)
- Always validate and convert before using
- Use `Number()`, `parseInt()`, or `parseFloat()` for conversion
- Check `isNaN()` after conversion

### 2. Validation Strategy
```js
// Good validation pattern:
const id = Number(req.params.id);
if (isNaN(id)) {
  return res.status(400).json({ error: "Invalid ID" });
}
// Now safe to use id
```

### 3. Route Order
```js
// ✅ Correct order
app.get("/api/products/featured", ...)  // Specific first
app.get("/api/products/:id", ...)       // Generic after

// ❌ Wrong order
app.get("/api/products/:id", ...)       // Catches everything
app.get("/api/products/featured", ...)  // Never reached!
```

### 4. Single Response Rule
```js
// ❌ Wrong - multiple responses
if (error) {
  res.status(400).json({ error });
}
res.status(200).json({ success: true }); // ⚠️ Error!

// ✅ Correct - return after response
if (error) {
  res.status(400).json({ error });
  return; // ← Critical!
}
res.status(200).json({ success: true });
```

### 5. Status Code Meanings
- **200 OK**: Request succeeded (even if data is empty array)
- **400 Bad Request**: Client sent invalid/malformed data
- **404 Not Found**: Valid request, but resource doesn't exist
- **500 Internal Server Error**: Server crashed/exception

### 6. 404 Handler Pattern
```js
// All your routes here
app.get("/api/products", ...)
app.get("/about", ...)

// 404 handler MUST be last
app.use((req, res) => {
  res.status(404).send("Not found");
});
```

## 🔍 Common Mistakes to Avoid

1. **Forgetting type conversion**: `product.id === req.params.id` (number vs string)
2. **Not validating**: Assuming `req.params.id` is always a valid number
3. **Case-sensitive search**: User frustration when "CHAIR" doesn't find "chair"
4. **No bounds checking**: Accepting `limit=-5` or `limit=999999`
5. **Wrong route order**: Specific routes after generic ones
6. **Multiple responses**: Forgetting `return` after `res.json()`
7. **Wrong 404 syntax**: Using `app.all("/{*any}")` instead of `app.use()`

## 💡 Advanced Topics to Explore

1. **Middleware**: Extract validation into reusable middleware
   ```js
   const validateProductId = (req, res, next) => {
     const id = Number(req.params.productId);
     if (isNaN(id)) {
       return res.status(400).json({ error: "Invalid ID" });
     }
     req.productId = id; // Attach converted value
     next();
   };
   
   app.get("/api/products/:productId", validateProductId, (req, res) => {
     // req.productId is already validated and converted
   });
   ```

2. **Pagination**: Add `page` and `pageSize` query params
   ```js
   const page = Number(req.query.page) || 1;
   const pageSize = Number(req.query.pageSize) || 10;
   const start = (page - 1) * pageSize;
   const end = start + pageSize;
   const paginatedData = allData.slice(start, end);
   ```

3. **Sorting**: Add `sort` query param
   ```js
   // ?sort=name:asc or ?sort=price:desc
   const [field, order] = (req.query.sort || "").split(":");
   if (field && order) {
     data.sort((a, b) => {
       if (order === "asc") return a[field] > b[field] ? 1 : -1;
       return a[field] < b[field] ? 1 : -1;
     });
   }
   ```

4. **Error handling middleware**: Centralize error responses
   ```js
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(500).json({ error: "Something went wrong" });
   });
   ```
