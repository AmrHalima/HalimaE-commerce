# Halima E-Commerce Backend API

A robust, production-ready e-commerce backend built with NestJS, Prisma, and PostgreSQL. This API provides comprehensive e-commerce functionality including product management, user authentication, shopping cart, orders, and payment processing.

## 🚀 Features

### Core Functionality
- **Product Management**: Full CRUD operations with variants, pricing, and inventory tracking
- **Category System**: Hierarchical categories with parent-child relationships
- **Shopping Cart**: Persistent cart with real-time inventory validation
- **Order Management**: Complete order lifecycle from placement to fulfillment
- **User Authentication**: Dual authentication system for customers and admin users
- **Address Management**: Multiple shipping and billing addresses per customer
- **Payment Processing**: Payment integration with refund support
- **Shipment Tracking**: Order fulfillment and delivery tracking

### Technical Features
- **JWT Authentication**: Separate JWT strategies for customers and admin users
- **Role-Based Access Control**: Admin and customer role separation
- **Rate Limiting**: Three-tier throttling (3/1s, 20/10s, 100/60s)
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Image Upload**: Product image management with file storage
- **Database Optimization**: Comprehensive indexing for high-performance queries
- **Logging**: Winston-based logging with daily rotation
- **Security**: Helmet middleware, CORS configuration, password hashing with Argon2
- **Validation**: Request validation with class-validator and class-transformer
- **E2E Testing**: Comprehensive end-to-end test coverage

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm >= 9.x

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AmrHalima/HalimaE-commerce.git
   cd HalimaE-commerce/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**

   Create a `.env` file in the backend directory:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/halima_ecommerce?schema=public"

   # Application
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:3001

   # JWT Secrets (generate strong random strings)
   JWT_USER_SECRET=your_secure_admin_jwt_secret_here
   JWT_CUSTOMER_SECRET=your_secure_customer_jwt_secret_here

   # File Upload
   MAX_FILE_SIZE=5242880  # 5MB in bytes
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate deploy

   # Seed database (optional)
   npm run db:seed
   ```

## 🚀 Running the Application

### Development
```bash
# Start in watch mode
npm run start:dev

# Start in debug mode
npm run start:debug
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/docs-json`

## 🗄️ Database Schema

### Main Entities

#### Product System
- **Product**: Core product information with status and soft delete
- **ProductVariant**: SKU-based variants (size, color, material)
- **VariantPrice**: Multi-currency pricing with compare-at prices
- **VariantInventory**: Stock management with low-stock alerts
- **ProductImage**: Product images with sorting and alt text
- **Category**: Hierarchical category structure

#### Customer & Orders
- **Customer**: Customer accounts with authentication
- **Address**: Multiple addresses per customer
- **Cart**: Persistent shopping cart with items
- **Order**: Complete order with status tracking
- **OrderItem**: Individual line items with snapshots
- **Payment**: Payment records with provider integration
- **Refund**: Refund processing
- **Shipment**: Shipping and tracking information

#### Administration
- **User**: Admin user accounts
- **Role**: Role-based access control

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── auth/                  # Authentication modules
│   │   ├── customer-auth/     # Customer JWT auth
│   │   └── user-auth/         # Admin user JWT auth
│   ├── cart/                  # Shopping cart
│   ├── category/              # Category management
│   ├── customer/              # Customer & address management
│   ├── product/               # Product, variant, image services
│   ├── users/                 # Admin user management
│   ├── logger/                # Winston logging service
│   ├── prisma/                # Prisma database service
│   └── utils/                 # Shared utilities
├── common/
│   ├── decorators/            # Custom decorators
│   ├── dto/                   # Shared DTOs
│   ├── filters/               # Exception filters
│   └── interceptors/          # Response interceptors
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── seed.ts                # Database seeding
├── test/                      # E2E tests
└── public/uploads/            # Uploaded files
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔒 Security Features

- **Password Hashing**: Argon2 algorithm for secure password storage
- **JWT Tokens**: Separate tokens for customers and admin users
- **Rate Limiting**: Automatic throttling to prevent abuse
- **Helmet**: Security headers configuration
- **CORS**: Controlled cross-origin resource sharing
- **Input Validation**: All inputs validated with class-validator
- **SQL Injection Protection**: Prisma's query parameterization
- **ConfigService**: Environment variables managed securely

## 📊 Performance Optimizations

- **Database Indexes**: 15+ strategic indexes on frequently queried fields
- **Query Optimization**: Efficient queries with `findUnique()` on indexed fields
- **Connection Pooling**: Prisma connection management
- **Response Caching**: Structured response format for easy caching
- **Lazy Loading**: Related entities loaded on demand
- **File Upload Optimization**: Size and type restrictions

## 🔧 Database Scripts

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed the database
npm run db:seed
```

## 📝 Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format
```

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Application port | 3000 |
| `FRONTEND_URL` | Frontend origin for CORS | Required |
| `JWT_USER_SECRET` | Admin JWT secret | Required |
| `JWT_CUSTOMER_SECRET` | Customer JWT secret | Required |

## 🐳 Docker Support (Coming Soon)

Docker configuration will be added for containerized deployment.

## 🚀 Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Use strong, unique JWT secrets
3. Enable SSL/TLS for database connections
4. Configure production logging (disable console logs)
5. Set up database backups
6. Configure file upload storage (S3, CDN)
7. Enable application monitoring
8. Set appropriate rate limits
9. Configure CORS for production domain

### Recommended Hosting
- **API**: Heroku, AWS, DigitalOcean, Railway
- **Database**: AWS RDS, DigitalOcean Managed Database, Supabase
- **File Storage**: AWS S3, Cloudinary, DigitalOcean Spaces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](../LICENSE) file for details.

## 👨‍💻 Author

**OmarElprolosy66**

## Acknowledgments

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [PostgreSQL](https://www.postgresql.org/) - The world's most advanced open source database
