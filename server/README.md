# AURA E-commerce Backend Server

This is the backend server for the AURA e-commerce platform, built with Node.js, Express, and MongoDB.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/aura_db
JWT_SECRET=your_jwt_secret_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

3. Start MongoDB service on your machine

4. Seed initial data (optional):
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password with token

### Users
- GET `/api/users/profile` - Get user profile
- PATCH `/api/users/profile` - Update user profile
- PATCH `/api/users/change-password` - Change password
- POST `/api/users/address` - Add new address
- PATCH `/api/users/address/:id` - Update address
- DELETE `/api/users/address/:id` - Delete address
- PATCH `/api/users/address/:id/default` - Set default address

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get product by ID
- POST `/api/products` - Create new product (Admin)
- PATCH `/api/products/:id` - Update product (Admin)
- DELETE `/api/products/:id` - Delete product (Admin)

### Orders
- GET `/api/orders` - Get all orders (Admin)
- GET `/api/orders/my-orders` - Get user's orders
- GET `/api/orders/:id` - Get order by ID
- POST `/api/orders` - Create new order
- PATCH `/api/orders/:id/status` - Update order status (Admin)
- PATCH `/api/orders/:id/cancel` - Cancel order

### Reviews
- GET `/api/reviews/product/:id` - Get product reviews
- GET `/api/reviews/user` - Get user's reviews
- POST `/api/reviews` - Create new review
- PATCH `/api/reviews/:id` - Update review
- DELETE `/api/reviews/:id` - Delete review
- POST `/api/reviews/:id/like` - Like/unlike review
- POST `/api/reviews/:id/reply` - Add reply to review (Admin)
- DELETE `/api/reviews/:id/reply/:replyId` - Delete reply (Admin)

## Error Handling

The server implements a centralized error handling middleware that processes various types of errors:
- Validation errors
- Authentication errors
- Authorization errors
- Database errors
- Custom application errors

All error responses follow a consistent format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Optional validation errors array
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
``` 