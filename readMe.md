# E-Commerce Backend API

A comprehensive REST API backend for e-commerce applications built with Node.js, Express, and MongoDB. This API provides all the endpoints needed to power a full-featured e-commerce mobile or web application.

## 🚀 Features

- **Authentication & Authorization**
  - JWT token-based authentication
  - User registration and login
  - Role-based access control (Customer, Admin)
  - Token refresh mechanism

- **Product Management**
  - Complete CRUD operations for products
  - Product search and filtering
  - Product variations and attributes
  - Stock management
  - Product reviews and ratings

- **Category Management**
  - Hierarchical category structure
  - Category CRUD operations
  - Product count tracking

- **Shopping Cart**
  - Add/update/remove items
  - Cart persistence per user
  - Automatic total calculation
  - Cart expiration

- **Order Management**
  - Order creation and tracking
  - Order status management
  - Order history
  - Automatic stock updates

- **Wishlist**
  - Add/remove products
  - User-specific wishlists

- **Customer Profiles**
  - User profile management
  - Billing and shipping addresses
  - Order history tracking

- **Search & Discovery**
  - Global search across products and categories
  - Text-based search
  - Advanced filtering

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
cd ecommerce-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables:
```env
NODE_ENV=development
PORT=9211
MONGODB_URI=mongodb://localhost:27017/ecommerce_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h
```

4. **Start MongoDB**

Make sure MongoDB is running on your system:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services
```

5. **Seed the Database** (Optional)

Populate the database with sample data:
```bash
npm run seed
```

This will create:
- 2 users (1 admin, 1 customer)
- 5 categories
- 8 products
- 5 tags

**Default Login Credentials:**
- **Admin:** admin@ecommerce.com / admin123
- **Customer:** john@example.com / password123

6. **Start the Server**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at: `http://localhost:9211`

## 📚 API Documentation

### Base URL
```
http://localhost:9211/wp-json
```

### Authentication Endpoints

#### Login
```http
POST /wp-json/jwt-auth/v1/token
Content-Type: application/json

{
  "username": "admin@ecommerce.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user_email": "admin@ecommerce.com",
  "user_nicename": "admin",
  "user_display_name": "Admin User",
  "user_id": "507f1f77bcf86cd799439011",
  "user_avatar": "https://secure.gravatar.com/avatar/default.jpg?s=96"
}
```

#### Register
```http
POST /wp-json/tradebakerz/wc/v1/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

#### Validate Token
```http
POST /wp-json/jwt-auth/v1/validate
Authorization: Bearer {token}
```

### Product Endpoints

#### Get All Products
```http
GET /wp-json/wc/v3/products?page=1&per_page=10&category=123&search=iphone&orderby=price&order=asc
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10, max: 100)
- `category` - Filter by category ID
- `search` - Search term
- `orderby` - Sort by: date, title, price, popularity, rating
- `order` - Sort order: asc, desc
- `featured` - Filter featured products: true, false
- `on_sale` - Filter sale products: true, false

#### Get Single Product
```http
GET /wp-json/wc/v3/products/{id}
```

#### Create Product (Admin Only)
```http
POST /wp-json/wc/v3/products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "New Product",
  "price": 99.99,
  "description": "Product description",
  "categories": ["category_id"],
  "stockQuantity": 100
}
```

### Category Endpoints

#### Get All Categories
```http
GET /wp-json/wc/v3/products/categories?page=1&per_page=10
```

#### Get Single Category
```http
GET /wp-json/wc/v3/products/categories/{id}
```

### Cart Endpoints

#### Get Cart
```http
GET /wp-json/wc/v3/cart
Authorization: Bearer {token}
```

#### Add to Cart
```http
POST /wp-json/wc/v3/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "product_id",
  "quantity": 2,
  "variation": {
    "attribute_color": "black",
    "attribute_size": "large"
  }
}
```

#### Update Cart Item
```http
POST /wp-json/wc/v3/cart/update-item
Authorization: Bearer {token}
Content-Type: application/json

{
  "key": "item_id",
  "quantity": 3
}
```

#### Remove Cart Item
```http
POST /wp-json/wc/v3/cart/remove-item
Authorization: Bearer {token}
Content-Type: application/json

{
  "key": "item_id"
}
```

#### Clear Cart
```http
POST /wp-json/wc/v3/cart/clear
Authorization: Bearer {token}
```

### Order Endpoints

#### Create Order
```http
POST /wp-json/wc/v3/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "payment_method": "bacs",
  "payment_method_title": "Direct Bank Transfer",
  "billing": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US",
    "email": "john@example.com",
    "phone": "+1-555-123-4567"
  },
  "shipping": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US"
  },
  "line_items": [
    {
      "product_id": "product_id",
      "quantity": 2
    }
  ],
  "shipping_lines": [
    {
      "method_id": "flat_rate",
      "method_title": "Flat Rate",
      "total": "10.00"
    }
  ]
}
```

#### Get Orders
```http
GET /wp-json/wc/v3/orders?customer={user_id}&status=completed
Authorization: Bearer {token}
```

#### Get Single Order
```http
GET /wp-json/wc/v3/orders/{id}
Authorization: Bearer {token}
```

### Wishlist Endpoints

#### Get Wishlist
```http
GET /wp-json/tradebakerz/wc/v1/wishlist
Authorization: Bearer {token}
```

#### Add to Wishlist
```http
POST /wp-json/tradebakerz/wc/v1/wishlist/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": "product_id"
}
```

#### Remove from Wishlist
```http
DELETE /wp-json/tradebakerz/wc/v1/wishlist/{product_id}
Authorization: Bearer {token}
```

### Review Endpoints

#### Get Product Reviews
```http
GET /wp-json/wc/v3/products/reviews?product_id={id}
```

#### Create Review
```http
POST /wp-json/wc/v3/products/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": "product_id",
  "review": "Great product!",
  "rating": 5
}
```

### Customer Endpoints

#### Get Customer Profile
```http
GET /wp-json/wc/v3/customers/{id}
Authorization: Bearer {token}
```

#### Update Customer Profile
```http
PUT /wp-json/wc/v3/customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "billing": {...},
  "shipping": {...}
}
```

### Search Endpoint

#### Global Search
```http
GET /wp-json/tradebakerz/wc/v1/search?q=iphone&type=products&page=1&per_page=10
```

**Query Parameters:**
- `q` - Search query (required)
- `type` - Search type: products, categories, all (default: products)
- `page` - Page number
- `per_page` - Items per page

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per minute)
- Helmet.js for security headers
- CORS configuration
- Input validation with express-validator
- MongoDB injection protection
- XSS protection

## 📊 Database Schema

### Collections

- **users** - User accounts and profiles
- **products** - Product catalog
- **categories** - Product categories
- **carts** - Shopping carts
- **orders** - Order records
- **wishlists** - User wishlists
- **reviews** - Product reviews
- **tags** - Product tags

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📦 Project Structure

```
ecommerce-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── productController.js # Product operations
│   │   ├── categoryCartController.js
│   │   ├── orderController.js
│   │   └── customerWishlistController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── error.js             # Error handling
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   └── index.js             # Wishlist, Review, Tag models
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── api.js               # All other routes
│   ├── utils/
│   │   └── seeder.js            # Database seeding
│   └── server.js                # App entry point
├── .env.example
├── package.json
└── README.md
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=9211
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
JWT_SECRET=your_production_secret_key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Deploy to Heroku

```bash
heroku create your-app-name
heroku addons:create mongolab
git push heroku main
```

### Deploy to AWS/DigitalOcean/VPS

1. Install Node.js and MongoDB on your server
2. Clone the repository
3. Install dependencies: `npm install --production`
4. Set environment variables
5. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name ecommerce-api
   pm2 startup
   pm2 save
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@example.com

## 🔄 API Versioning

Current API version: **v1**

The API uses URL-based versioning (e.g., `/wc/v3/`).

## ⚡ Performance Tips

1. **Enable Redis caching** for frequently accessed data
2. **Use pagination** for large datasets
3. **Implement database indexing** (already included in models)
4. **Use compression** (already enabled)
5. **Monitor with tools** like New Relic or DataDog

## 📈 Monitoring

Health check endpoint:
```http
GET /health
```

Returns server status, uptime, and environment information.

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access

### JWT Token Issues
- Check token expiration
- Verify JWT_SECRET is set
- Ensure Authorization header format: `Bearer {token}`

### Port Already in Use
```bash
# Find and kill process using port 9211
lsof -ti:9211 | xargs kill -9
```

---