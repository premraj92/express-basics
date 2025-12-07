# Express Middleware - Advanced Concepts

This guide covers advanced middleware patterns and concepts that build on the basics. Study these after understanding the fundamentals in the explained files.

---

## 📚 Table of Contents
1. [Error Handling Middleware](#1-error-handling-middleware)
2. [Async Middleware Patterns](#2-async-middleware-patterns)
3. [Middleware Factories](#3-middleware-factories)
4. [Middleware Order & Flow Control](#4-middleware-order--flow-control)
5. [Built-in Express Middleware](#5-built-in-express-middleware)
6. [Third-Party Middleware](#6-third-party-middleware)
7. [Testing Middleware](#7-testing-middleware)
8. [Real-World Patterns](#8-real-world-patterns)

---

## 1. Error Handling Middleware

### The Special 4-Parameter Signature

Error middleware is **special** - Express recognizes it by having **4 parameters** (instead of 3):

```js
// Regular middleware: 3 params
const regularMiddleware = (req, res, next) => { ... }

// Error middleware: 4 params (err is FIRST!)
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: 'Something went wrong' })
}
```

### How Errors Reach Error Middleware

**Method 1: Pass error to next()**
```js
const someMiddleware = (req, res, next) => {
  if (somethingWrong) {
    const error = new Error('Something bad happened')
    error.status = 400
    next(error) // ← Skips all regular middleware, goes to error handler
    return
  }
  next()
}
```

**Method 2: Throw in synchronous code**
```js
const someMiddleware = (req, res, next) => {
  // Express catches synchronous errors automatically
  throw new Error('Sync error') // ← Caught by Express, sent to error handler
}
```

**Method 3: Async errors (requires wrapper - see Async section)**
```js
// ❌ This WON'T be caught by Express!
const badAsync = async (req, res, next) => {
  throw new Error('Async error') // ← NOT caught! App crashes!
}

// ✅ Must explicitly pass to next()
const goodAsync = async (req, res, next) => {
  try {
    await somethingAsync()
    next()
  } catch (err) {
    next(err) // ← Explicitly pass error
  }
}
```

### Complete Error Handling Setup

```js
const express = require('express')
const app = express()

// Regular routes and middleware
app.get('/users', async (req, res, next) => {
  try {
    const users = await db.getUsers()
    res.json(users)
  } catch (err) {
    next(err) // Pass error to error handler
  }
})

// 404 handler (for routes that don't exist)
// Must come AFTER all routes
app.use((req, res, next) => {
  const error = new Error('Route not found')
  error.status = 404
  next(error) // Pass to error handler
})

// Error handler MUST be LAST
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      // Only show stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
})
```

### Multiple Error Handlers (Cascading)

```js
// Specific error handler for database errors
app.use((err, req, res, next) => {
  if (err.name === 'DatabaseError') {
    return res.status(503).json({ error: 'Database unavailable' })
  }
  next(err) // Pass to next error handler
})

// Specific error handler for validation errors
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }
  next(err)
})

// Generic catch-all error handler (must be last)
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' })
})
```

---

## 2. Async Middleware Patterns

### The Async Problem

Express was designed before async/await existed. It doesn't automatically catch errors in async functions:

```js
// ❌ PROBLEM: Async errors crash the app
app.get('/users', async (req, res) => {
  const users = await db.getUsers() // If this throws, app CRASHES!
  res.json(users)
})
```

### Solution 1: Try-Catch in Every Route (Tedious)

```js
app.get('/users', async (req, res, next) => {
  try {
    const users = await db.getUsers()
    res.json(users)
  } catch (err) {
    next(err) // Pass to error handler
  }
})
```

### Solution 2: Async Wrapper (DRY)

```js
// Create a wrapper function
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Now wrap all async route handlers
app.get('/users', asyncHandler(async (req, res) => {
  const users = await db.getUsers() // Errors automatically caught!
  res.json(users)
}))

app.post('/users', asyncHandler(async (req, res) => {
  const user = await db.createUser(req.body)
  res.status(201).json(user)
}))
```

### Solution 3: Use express-async-errors Package

```js
// Install: npm install express-async-errors

// At the TOP of your main file (before routes)
require('express-async-errors')

// Now all async errors are automatically caught!
app.get('/users', async (req, res) => {
  const users = await db.getUsers() // Errors go to error handler automatically
  res.json(users)
})
```

### Async Middleware Example

```js
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    throw new Error('No token provided') // Goes to error handler
  }
  
  // Async database call
  const user = await db.getUserByToken(token)
  
  if (!user) {
    throw new Error('Invalid token')
  }
  
  req.user = user
  next()
})
```

---

## 3. Middleware Factories

Middleware factories are functions that **return** middleware. They allow configuration and reusability.

### Basic Factory Pattern

```js
// Factory: takes config, returns middleware
const logger = (options = {}) => {
  const format = options.format || 'simple'
  
  // This is the actual middleware
  return (req, res, next) => {
    if (format === 'simple') {
      console.log(`${req.method} ${req.url}`)
    } else if (format === 'detailed') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`)
    }
    next()
  }
}

// Usage: call the factory to create configured middleware
app.use(logger({ format: 'detailed' }))
```

### Real-World Example: Role-Based Authorization

```js
// Factory that creates middleware for different roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user should be set by authentication middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

// Usage: create specific middleware instances
app.get('/admin/users', requireRole('admin'), (req, res) => {
  // Only admins can access
})

app.get('/api/posts', requireRole('user', 'admin', 'moderator'), (req, res) => {
  // Multiple roles allowed
})

app.delete('/api/posts/:id', requireRole('admin', 'moderator'), (req, res) => {
  // Only admins and moderators
})
```

### Advanced Factory: Rate Limiting

```js
const rateLimit = (options = {}) => {
  const maxRequests = options.max || 100
  const windowMs = options.windowMs || 15 * 60 * 1000 // 15 minutes
  const requests = new Map() // Store: { ip: { count, resetTime } }
  
  return (req, res, next) => {
    const ip = req.ip
    const now = Date.now()
    const userRequests = requests.get(ip)
    
    if (!userRequests || now > userRequests.resetTime) {
      // First request or window expired
      requests.set(ip, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      })
    }
    
    userRequests.count++
    next()
  }
}

// Usage
app.use('/api/', rateLimit({ max: 100, windowMs: 15 * 60 * 1000 }))
app.use('/api/login', rateLimit({ max: 5, windowMs: 5 * 60 * 1000 })) // Stricter for login
```

### Why Factories Are Useful

1. **Configuration**: Customize behavior without changing code
2. **Reusability**: Create multiple instances with different configs
3. **Encapsulation**: Hide implementation details (like the `requests` Map)
4. **Testability**: Easier to test with different configurations

---

## 4. Middleware Order & Flow Control

### Execution Order Rules

```js
const app = express()

// 1. Global middleware (runs for ALL requests)
app.use(logger)           // Runs FIRST for every request
app.use(authenticate)     // Runs SECOND for every request

// 2. Router-level middleware (runs for paths matching mount point)
app.use('/api', apiLogger) // Only runs for /api/* paths

// 3. Route-specific middleware (runs for that specific route)
app.get('/users', authorize, getUsers) // authorize only for this route

// 4. Routes
app.get('/users', getUsers)
app.post('/users', createUser)

// 5. 404 handler (catches unmatched routes)
app.use((req, res) => res.status(404).send('Not found'))

// 6. Error handler (catches all errors)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})
```

### Flow Control with next()

```js
// next() → Continue to next middleware
const middleware1 = (req, res, next) => {
  console.log('middleware1')
  next() // Continue to middleware2
}

// next('route') → Skip remaining middleware for this route, go to next route
const middleware2 = (req, res, next) => {
  if (req.query.skip) {
    return next('route') // Skip to next matching route
  }
  next()
}

// next(error) → Skip to error handler
const middleware3 = (req, res, next) => {
  if (req.query.error) {
    return next(new Error('Forced error'))
  }
  next()
}

app.get('/test', middleware1, middleware2, middleware3, (req, res) => {
  res.send('Route handler')
})

app.get('/test', (req, res) => {
  res.send('Second route (reached with next("route"))')
})
```

### Common Mistake: Order Matters!

```js
// ❌ WRONG: 404 catches everything
app.use((req, res) => res.status(404).send('Not found'))
app.get('/users', getUsers) // Never reached!

// ✅ CORRECT: Routes first, then 404
app.get('/users', getUsers)
app.use((req, res) => res.status(404).send('Not found'))
```

---

## 5. Built-in Express Middleware

### express.json()

Parses JSON request bodies and populates `req.body`:

```js
app.use(express.json())

// Now you can access JSON data
app.post('/users', (req, res) => {
  console.log(req.body) // { name: "John", email: "john@example.com" }
  res.json({ received: req.body })
})
```

**Options:**
```js
app.use(express.json({
  limit: '10mb',        // Max body size
  strict: true,         // Only accept arrays and objects
  type: 'application/json' // Which content-type to parse
}))
```

### express.urlencoded()

Parses URL-encoded form data (HTML forms):

```js
app.use(express.urlencoded({ extended: true }))

// Now you can access form data
app.post('/login', (req, res) => {
  console.log(req.body) // { username: "john", password: "secret" }
})
```

**Extended option:**
- `extended: false` → Uses `querystring` library (simple key-value)
- `extended: true` → Uses `qs` library (nested objects, arrays)

### express.static()

Serves static files (HTML, CSS, JS, images):

```js
// Serve files from 'public' directory
app.use(express.static('public'))
// Now: http://localhost:3000/style.css → serves public/style.css

// With custom mount path
app.use('/assets', express.static('public'))
// Now: http://localhost:3000/assets/style.css → serves public/style.css

// Multiple static directories
app.use(express.static('public'))
app.use(express.static('uploads'))
```

**Options:**
```js
app.use(express.static('public', {
  maxAge: '1d',           // Cache for 1 day
  index: 'index.html',    // Default file
  dotfiles: 'ignore'      // Ignore .env, .gitignore, etc.
}))
```

---

## 6. Third-Party Middleware

### Popular Packages

#### cors (Cross-Origin Resource Sharing)
```js
const cors = require('cors')

// Allow all origins (development)
app.use(cors())

// Restrict origins (production)
app.use(cors({
  origin: 'https://myapp.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}))
```

#### helmet (Security Headers)
```js
const helmet = require('helmet')

// Add security headers
app.use(helmet())
// Sets: X-Content-Type-Options, X-Frame-Options, etc.
```

#### morgan (HTTP Logger)
```js
const morgan = require('morgan')

// Predefined formats
app.use(morgan('dev'))      // Colorful dev logs
app.use(morgan('combined')) // Apache-style logs

// Custom format
app.use(morgan(':method :url :status :response-time ms'))
```

#### multer (File Uploads)
```js
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

// Single file
app.post('/upload', upload.single('avatar'), (req, res) => {
  console.log(req.file) // File info
  res.send('Uploaded!')
})

// Multiple files
app.post('/photos', upload.array('photos', 10), (req, res) => {
  console.log(req.files) // Array of files
})
```

---

## 7. Testing Middleware

### Unit Testing with Jest

```js
const authorize = require('./authorize')

describe('authorize middleware', () => {
  let req, res, next
  
  beforeEach(() => {
    req = { query: {} }
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    }
    next = jest.fn()
  })
  
  test('calls next() when user is provided', () => {
    req.query.user = 'john'
    
    authorize(req, res, next)
    
    expect(req.user).toEqual({ name: 'john', id: 3 })
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
  
  test('returns 401 when user is missing', () => {
    authorize(req, res, next)
    
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.send).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })
})
```

### Integration Testing with Supertest

```js
const request = require('supertest')
const app = require('./app')

describe('GET /api/users', () => {
  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })
  
  test('returns users with valid auth', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ user: 'john' })
    
    expect(res.status).toBe(200)
  })
})
```

---

## 8. Real-World Patterns

### Pattern 1: Request ID Tracking

```js
const { v4: uuidv4 } = require('uuid')

const requestId = (req, res, next) => {
  req.id = uuidv4()
  res.setHeader('X-Request-ID', req.id)
  next()
}

const logger = (req, res, next) => {
  console.log(`[${req.id}] ${req.method} ${req.url}`)
  next()
}

app.use(requestId)
app.use(logger)
```

### Pattern 2: Response Time Tracking

```js
const responseTime = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.url} - ${duration}ms`)
  })
  
  next()
}
```

### Pattern 3: Database Connection Per Request

```js
const attachDb = async (req, res, next) => {
  try {
    req.db = await getDbConnection()
    
    // Clean up after response is sent
    res.on('finish', () => {
      req.db.close()
    })
    
    next()
  } catch (err) {
    next(err)
  }
}
```

### Pattern 4: Conditional Middleware

```js
const conditionalMiddleware = (condition, middleware) => {
  return (req, res, next) => {
    if (condition(req)) {
      return middleware(req, res, next)
    }
    next()
  }
}

// Usage
app.use(conditionalMiddleware(
  req => req.path.startsWith('/api'),
  authenticate
))
```

---

## 🎯 Key Takeaways

1. **Error middleware has 4 params** - Express recognizes it by signature
2. **Async errors must be caught manually** - Use try-catch or async wrapper
3. **Factories enable configuration** - Return middleware from functions
4. **Order is critical** - Global → Routes → 404 → Errors
5. **Built-in middleware is essential** - json(), urlencoded(), static()
6. **Always return after next()** - Prevent double execution
7. **Test middleware in isolation** - Mock req, res, next

---

## 📚 Further Reading

- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- [Error Handling in Express](https://expressjs.com/en/guide/error-handling.html)
- [Writing Middleware](https://expressjs.com/en/guide/writing-middleware.html)
- [express-async-errors on npm](https://www.npmjs.com/package/express-async-errors)
