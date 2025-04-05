## File Responsibilities
server/
├── config/ - Configuration files
│ └── database.js - MongoDB connection setup
├── middleware/ - Custom middleware
│ ├── auth.js - Authentication and authorization
│ └── errorHandler.js - Global error handling
├── models/ - MongoDB schemas
│ ├── User.js - User data model
│ ├── Product.js - Product data model
│ ├── Order.js - Order data model
│ ├── Review.js - Review data model
│ ├── Cart.js - Shopping cart model
│ ├── Favorites.js - User favorites model
│ └── OTP.js - One-time password model
├── routes/ - API endpoints
│ ├── admin/ - Admin-specific routes
│ ├── auth.js - Authentication routes
│ ├── products.js - Product routes
│ ├── orders.js - Order management
│ ├── reviews.js - Review management
│ ├── users.js - User management
│ ├── cart.js - Shopping cart operations
│ ├── favorites.js - User favorites operations
│ └── upload.js - File upload handling
├── uploads/ - Uploaded files storage
├── utils/ - Utility functions
├── scripts/ - Maintenance scripts
└── index.js - Main application entry point

### Core Application Files

| File | Responsibility |
|------|----------------|
| `server/index.js` | Main application entry point; configures Express, middleware, and starts the server |
| `server/config.js` | Central configuration for database connection, JWT settings, and environment variables |
| `server/config/database.js` | MongoDB connection management and event handlers |

### Middleware Files

| File | Responsibility |
|------|----------------|
| `server/middleware/auth.js` | JWT authentication and authorization middleware |
| `server/middleware/errorHandler.js` | Global error handling and error formatting |
| `server/middleware/upload.js` | File upload configuration and handling |

### Model Files

| File | Responsibility |
|------|----------------|
| `server/models/User.js` | User data model with authentication methods |
| `server/models/Product.js` | Product data model with stock management |
| `server/models/Order.js` | Order data model with order status management |
| `server/models/Review.js` | Review data model with validation |
| `server/models/Cart.js` | Shopping cart data model with price calculation |
| `server/models/Favorites.js` | User favorites/wishlist model |
| `server/models/OTP.js` | One-time password model for email verification |

### Route Files

| File | Responsibility |
|------|----------------|
| `server/routes/auth.js` | Authentication endpoints (login, register, password reset) |
| `server/routes/products.js` | Product management endpoints |
| `server/routes/orders.js` | Order processing endpoints |
| `server/routes/users.js` | User profile management endpoints |
| `server/routes/reviews.js` | Product review endpoints |
| `server/routes/cart.js` | Shopping cart manipulation endpoints |
| `server/routes/favorites.js` | User favorites management endpoints |
| `server/routes/upload.js` | File upload endpoints |
| `server/routes/admin.js` | Admin dashboard routing |
| `server/routes/admin/products.js` | Admin product management endpoints |
| `server/routes/admin/orders.js` | Admin order management endpoints |
| `server/routes/admin/users.js` | Admin user management endpoints |
| `server/routes/admin/reports.js` | Admin reporting and analytics endpoints |

### Utility Files

| File | Responsibility |
|------|----------------|
| `server/utils/emailService.js` | Email sending functionality |
| `server/utils/validators.js` | Input validation functions |
| `server/scripts/seedDummyData.js` | Database seeding for development |
| `server/scripts/createAdmin.js` | Admin user creation utility |
| `server/scripts/fix-db.js` | Database repair utilities |

## Complete API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| POST | `/api/auth/register` | Register new user | No | `{name, email, password}` | `{token, user}` |
| POST | `/api/auth/login` | User login | No | `{email, password}` | `{token, user}` |
| POST | `/api/auth/verify-email` | Verify email address | No | `{email, otp}` | `{success}` |
| POST | `/api/auth/resend-verification` | Resend verification email | No | `{email}` | `{success}` |
| POST | `/api/auth/forgot-password` | Request password reset | No | `{email}` | `{success}` |
| POST | `/api/auth/reset-password` | Reset password with token | No | `{token, password}` | `{success}` |
| GET | `/api/auth/current-user` | Get current user info | Yes | - | `{user}` |
| POST | `/api/auth/logout` | Log out user | Yes | - | `{success}` |
| POST | `/api/auth/refresh-token` | Refresh JWT token | Yes | - | `{token}` |

### User Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| GET | `/api/users/profile` | Get user profile | Yes | - | `{user}` |
| PATCH | `/api/users/profile` | Update user profile | Yes | `{name, email, phoneNumber, etc.}` | `{user}` |
| PATCH | `/api/users/change-password` | Change password | Yes | `{currentPassword, newPassword}` | `{success}` |
| POST | `/api/users/profile-image` | Upload profile image | Yes | `FormData` | `{imageUrl}` |
| GET | `/api/users/addresses` | Get all addresses | Yes | - | `[addresses]` |
| POST | `/api/users/address` | Add new address | Yes | `{street, city, state, etc.}` | `{address}` |
| PATCH | `/api/users/address/:id` | Update address | Yes | `{street, city, state, etc.}` | `{address}` |
| DELETE | `/api/users/address/:id` | Delete address | Yes | - | `{success}` |
| PATCH | `/api/users/address/:id/default` | Set default address | Yes | - | `{success}` |
| GET | `/api/users/payment-methods` | Get payment methods | Yes | - | `[paymentMethods]` |
| POST | `/api/users/payment-method` | Add payment method | Yes | `{cardName, cardNumber, etc.}` | `{paymentMethod}` |
| DELETE | `/api/users/payment-method/:id` | Delete payment method | Yes | - | `{success}` |
| PATCH | `/api/users/payment-method/:id/default` | Set default payment | Yes | - | `{success}` |

### Product Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| GET | `/api/products` | Get all products with filters | No | - | `{products, pagination}` |
| GET | `/api/products/:id` | Get product by ID | No | - | `{product}` |
| GET | `/api/products/category/:category` | Get products by category | No | - | `{products}` |
| GET | `/api/products/search` | Search products | No | - | `{products, pagination}` |
| GET | `/api/products/featured` | Get featured products | No | - | `{products}` |
| GET | `/api/products/bestsellers` | Get bestselling products | No | - | `{products}` |
| GET | `/api/products/new-arrivals` | Get new arrivals | No | - | `{products}` |
| GET | `/api/products/related/:id` | Get related products | No | - | `{products}` |

### Order Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| GET | `/api/orders` | Get user's orders | Yes | - | `{orders}` |
| GET | `/api/orders/:id` | Get order by ID | Yes | - | `{order}` |
| POST | `/api/orders` | Create new order | Yes | `{items, shippingAddress, etc.}` | `{order}` |
| PATCH | `/api/orders/:id/cancel` | Cancel order | Yes | `{cancellationReason}` | `{order}` |
| GET | `/api/orders/track/:id` | Track order status | Yes | - | `{tracking}` |

### Review Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| GET | `/api/reviews/product/:productId` | Get product reviews | No | - | `{reviews}` |
| GET | `/api/reviews/user` | Get user's reviews | Yes | - | `{reviews}` |
| POST | `/api/reviews` | Create new review | Yes | `{productId, rating, comment}` | `{review}` |
| PATCH | `/api/reviews/:id` | Update review | Yes | `{rating, comment}` | `{review}` |
| DELETE | `/api/reviews/:id` | Delete review | Yes | - | `{success}` |
| POST | `/api/reviews/:id/like` | Like/unlike review | Yes | - | `{liked, likesCount}` |
| POST | `/api/reviews/:id/report` | Report review | Yes | `{reason}` | `{success}` |
| POST | `/api/reviews/:id/reply` | Reply to review | Yes (Admin) | `{comment}` | `{review}` |
| DELETE | `/api/reviews/:id/reply/:replyId` | Delete reply | Yes (Admin) | - | `{success}` |

### Cart Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| GET | `/api/cart` | Get user's cart | Yes | - | `{cart}` |
| POST | `/api/cart/add` | Add item to cart | Yes | `{productId, quantity, size}` | `{cart}` |
| PATCH | `/api/cart/item/:productId` | Update item quantity | Yes | `{quantity, size}` | `{cart}` |
| DELETE | `/api/cart/item/:productId` | Remove item from cart | Yes | - | `{cart}` |
| DELETE | `/api/cart/clear` | Clear cart | Yes | - | `{success}` |
| POST | `/api/cart/checkout` | Proceed to checkout | Yes | - | `{checkoutSession}` |

### Favorites Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| GET | `/api/favorites` | Get user's favorites | Yes | - | `{favorites}` |
| POST | `/api/favorites/add/:productId` | Add to favorites | Yes | - | `{success}` |
| DELETE | `/api/favorites/remove/:productId` | Remove from favorites | Yes | - | `{success}` |
| GET | `/api/favorites/check/:productId` | Check if in favorites | Yes | - | `{isFavorite}` |

### Upload Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| POST | `/api/upload/single` | Upload single file | Yes | `FormData` | `{file}` |
| POST | `/api/upload/multiple` | Upload multiple files | Yes | `FormData` | `{files}` |
| POST | `/api/upload/model` | Upload 3D model file | Yes | `FormData` | `{modelUrl}` |
| POST | `/api/upload/image` | Upload image | Yes | `FormData` | `{imageUrl}` |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| GET | `/api/admin/dashboard` | Get dashboard stats | Yes (Admin) | - | `{stats}` |
| GET | `/api/admin/products` | Get all products | Yes (Admin) | - | `{products}` |
| POST | `/api/admin/products` | Create product | Yes (Admin) | `{product details}` | `{product}` |
| PATCH | `/api/admin/products/:id` | Update product | Yes (Admin) | `{product details}` | `{product}` |
| DELETE | `/api/admin/products/:id` | Delete product | Yes (Admin) | - | `{success}` |
| GET | `/api/admin/orders` | Get all orders | Yes (Admin) | - | `{orders}` |
| PATCH | `/api/admin/orders/:id/status` | Update order status | Yes (Admin) | `{status}` | `{order}` |
| GET | `/api/admin/users` | Get all users | Yes (Admin) | - | `{users}` |
| PATCH | `/api/admin/users/:id/role` | Update user role | Yes (Admin) | `{isAdmin}` | `{user}` |
| DELETE | `/api/admin/users/:id` | Delete user | Yes (Admin) | - | `{success}` |
| GET | `/api/admin/reports/sales` | Get sales reports | Yes (Admin) | - | `{report}` |
| GET | `/api/admin/reports/revenue` | Get revenue reports | Yes (Admin) | - | `{report}` |
| GET | `/api/admin/reports/popular` | Get popular products | Yes (Admin) | - | `{products}` |




## Working

## Core Components

### 1. Database Connection (config/database.js)

The application uses MongoDB as its database, with connection handled through Mongoose. Features include:
- Connection pooling
- Error handling for database operations
- Automatic reconnection
- Graceful shutdown handling

```javascript
// Connection is established with these options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

### 2. Authentication System (middleware/auth.js)

JWT-based authentication system with two middleware functions:
- `auth`: Verifies user tokens and attaches user data to request object
- `adminAuth`: Extends auth middleware to ensure the user has admin privileges

```javascript
// Token extraction from Authorization header
const token = req.header('Authorization')?.replace('Bearer ', '');
// Verification and user lookup
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(decoded.userId).select('-password');
```

### 3. Error Handling (middleware/errorHandler.js)

Centralized error handling middleware that:
- Categorizes errors by type (MongoDB errors, JWT errors, etc.)
- Formats appropriate responses
- Strips sensitive information in production environment

```javascript
// Different error types handled
if (err.name === 'ValidationError') { /* MongoDB validation errors */ }
if (err.code === 11000) { /* Duplicate key errors */ }
if (err.name === 'JsonWebTokenError') { /* JWT errors */ }
```

### 4. Data Models

#### User Model (models/User.js)
- Stores user profiles with personal information
- Includes embedded schemas for:
  - Address information
  - Payment methods
  - Security information
  - Session history

#### Product Model (models/Product.js)
- Stores product details including:
  - Basic information (name, description, price)
  - Categorization
  - Size variations
  - Stock information
  - 3D model URLs
  - Rating aggregation

#### Order Model (models/Order.js)
- Manages order information with:
  - Order items (products, quantities, prices)
  - Shipping details
  - Payment information
  - Order status tracking

#### Review Model (models/Review.js)
- Handles product reviews with:
  - Rating values
  - Review text
  - User references
  - Media attachments
  - Helpful/like counts

#### Cart Model (models/Cart.js)
- Manages shopping cart with:
  - Cart items
  - Total calculation
  - User reference

### 5. API Routes

#### Authentication Routes (/api/auth)
- User registration
- Login/logout functionality
- Password reset
- Email verification
- Current user information

#### Product Routes (/api/products)
- Product listing with filtering and sorting
- Product details
- Category-based product retrieval
- Search functionality

#### Order Routes (/api/orders)
- Order creation and processing
- Order history
- Order status updates
- Order cancellation

#### User Routes (/api/users)
- Profile management
- Address management
- Payment method management
- Account settings

#### Review Routes (/api/reviews)
- Adding/editing reviews
- Retrieving reviews by product
- Reporting inappropriate reviews

#### Cart Routes (/api/cart)
- Add/remove items from cart
- Update quantities
- Cart synchronization

#### Favorites Routes (/api/favorites)
- Add/remove favorites
- List favorites

#### Upload Routes (/api/upload)
- File upload handling for:
  - Product images
  - User profile pictures
  - 3D model files

#### Admin Routes (/api/admin/*)
- Advanced product management
- User management
- Order processing
- Reports and analytics

## Security Measures

1. **Authentication**: JWT-based authentication system with token expiration
2. **Authorization**: Role-based access control for admin functionality
3. **Password Security**: Password hashing using bcrypt
4. **Input Validation**: Server-side validation for all inputs
5. **Error Handling**: Sanitized error responses to prevent leaking sensitive information
6. **MongoDB Security**: Index optimization and protection against injection attacks

## API Flow Examples

### User Authentication Flow

1. Client submits login credentials to `/api/auth/login`
2. Server validates credentials and issues JWT
3. Client includes JWT in Authorization header for subsequent requests
4. Server validates JWT in auth middleware for protected routes

### Product Retrieval Flow

1. Client requests product list from `/api/products`
2. Server retrieves products from MongoDB with optional filtering
3. Response includes product details, images, and pagination information

### Order Creation Flow

1. Client submits cart contents to `/api/orders`
2. Server validates product availability and pricing
3. Order is created in the database
4. Payment processing is initiated
5. Order confirmation is returned

## Error Handling Strategy

The application implements a centralized error handling approach:

1. Router handlers catch errors and pass them to Express error middleware
2. The errorHandler middleware categorizes and formats errors
3. Standard error response format includes:
   - Status code
   - Error message
   - Detailed information (in development only)

## Database Schema Relationships

- **User-Order**: One-to-many relationship (user has many orders)
- **User-Review**: One-to-many relationship (user has many reviews)
- **Product-Review**: One-to-many relationship (product has many reviews)
- **User-Cart**: One-to-one relationship (user has one cart)
- **User-Favorites**: One-to-one relationship (user has one favorites list)

## Performance Considerations

1. **Database Indexing**: Strategic indexes on commonly queried fields
2. **Query Optimization**: Selective field projection to reduce data transfer
3. **Connection Pooling**: Reuse of database connections
4. **Error Recovery**: Automatic reconnection to database on failure

## Deployment Considerations

The server is designed for flexible deployment with:
- Environment variable configuration via dotenv
- Port configuration for different environments
- MongoDB connection string configuration
- Separate development and production settings

## Maintenance Scripts

The server includes utility scripts for maintenance:
- Database seeding (`seedDummyData.js`)
- Admin user creation (`createAdmin.js`)
- Database repair utilities (`fix-db.js`)

## API Endpoints Reference

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password with token
- GET `/api/auth/current-user` - Get current user's info

### Users
- GET `/api/users/profile` - Get user profile
- PATCH `/api/users/profile` - Update user profile
- PATCH `/api/users/change-password` - Change password
- POST `/api/users/address` - Add new address
- PATCH `/api/users/address/:id` - Update address
- DELETE `/api/users/address/:id` - Delete address
- PATCH `/api/users/address/:id/default` - Set default address
- POST `/api/users/payment-method` - Add payment method
- DELETE `/api/users/payment-method/:id` - Delete payment method

### Products
- GET `/api/products` - Get all products with filtering options
- GET `/api/products/:id` - Get product by ID
- GET `/api/products/category/:category` - Get products by category
- GET `/api/products/search` - Search products
- POST `/api/products` - Create new product (Admin)
- PATCH `/api/products/:id` - Update product (Admin)
- DELETE `/api/products/:id` - Delete product (Admin)

### Orders
- GET `/api/orders` - Get user's orders
- GET `/api/orders/all` - Get all orders (Admin)
- GET `/api/orders/:id` - Get order by ID
- POST `/api/orders` - Create new order
- PATCH `/api/orders/:id/status` - Update order status (Admin)
- PATCH `/api/orders/:id/cancel` - Cancel order
- GET `/api/orders/stats` - Get order statistics (Admin)

### Reviews
- GET `/api/reviews/product/:productId` - Get product reviews
- GET `/api/reviews/user` - Get user's reviews
- POST `/api/reviews` - Create new review
- PATCH `/api/reviews/:id` - Update review
- DELETE `/api/reviews/:id` - Delete review
- POST `/api/reviews/:id/like` - Like/unlike review
- POST `/api/reviews/:id/reply` - Add reply to review

### Cart
- GET `/api/cart` - Get user's cart
- POST `/api/cart/add` - Add item to cart
- DELETE `/api/cart/item/:productId` - Remove item from cart
- PATCH `/api/cart/item/:productId` - Update item quantity
- DELETE `/api/cart/clear` - Clear cart

### Favorites
- GET `/api/favorites` - Get user's favorites
- POST `/api/favorites/add/:productId` - Add product to favorites
- DELETE `/api/favorites/remove/:productId` - Remove product from favorites

### File Upload
- POST `/api/upload/single` - Upload single file
- POST `/api/upload/multiple` - Upload multiple files
- POST `/api/upload/model` - Upload 3D model file

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure MongoDB service is running
   - Verify connection string in .env file
   - Check network connectivity and firewall settings

2. **Authentication Issues**
   - Verify JWT_SECRET in .env file
   - Check token expiration settings
   - Ensure correct token format in requests

3. **File Upload Issues**
   - Verify uploads directory exists and has write permissions
   - Check file size limits
   - Ensure proper Content-Type in requests

## Conclusion

The AURA server provides a comprehensive backend for an e-commerce application with features for authentication, product management, order processing, and more. Its modular design allows for easy extension and maintenance, while the security measures ensure data protection. The MongoDB integration provides a flexible data storage solution that can scale with the application.