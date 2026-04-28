# 🚀 Enterprise REST API Template

> **Production-ready Node.js REST API template with enterprise-grade features, monitoring, and comprehensive documentation**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0+-blue.svg)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-4.18+-green.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [🎯 About This Template](#-about-this-template)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ Project Structure](#️-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Development Methodology](#️-development-methodology)
- [📝 Code Structure & Standards](#-code-structure--standards)
- [🔐 Authentication & Security](#-authentication--security)
- [🔑 API Key Management](#-api-key-management)
- [📊 Monitoring & Observability](#-monitoring--observability)
- [🧪 Testing Guidelines](#-testing-guidelines)
- [📚 API Documentation](#-api-documentation)
- [🚀 Deployment](#-deployment)
- [🔄 CI/CD Pipeline](#-cicd-pipeline)
- [🛠️ Development Workflow](#️-development-workflow)
- [📋 Best Practices](#-best-practices)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 About This Template

This is a **production-ready enterprise REST API template** designed for agencies and development teams to kickstart their projects with industry-standard practices, security, and scalability in mind.

### 🎯 Key Features

- **🔒 Enterprise Security**: JWT authentication, API key management, RBAC, audit logging
- **📊 Comprehensive Monitoring**: Prometheus metrics, health checks, performance tracking
- **🚀 CI/CD Ready**: GitHub Actions pipeline with security scanning and Docker builds
- **🧪 Testing Infrastructure**: Jest framework with example templates
- **📝 Auto-Generated Docs**: OpenAPI/Swagger documentation with JSDoc comments
- **🐳 Docker Support**: Development and production Docker configurations
- **⚡ High Performance**: Optimized database queries, caching, and middleware
- **🛡️ Type Safety**: Full TypeScript implementation with strict typing

---

## 🛠️ Technology Stack

### **Backend & Core**

- **Node.js** (18+) - JavaScript runtime
- **Express.js** (4.18+) - Web framework
- **TypeScript** (5.0+) - Type-safe JavaScript
- **Prisma** (5.0+) - Database ORM and toolkit

### **Database & Storage**

- **PostgreSQL** (15+) - Primary database
- **Redis** (7+) - Caching and session storage
- **Prisma** - Database migrations and type generation

### **Authentication & Security**

- **jsonwebtoken** - JWT token management
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### **Monitoring & Observability**

- **prom-client** - Prometheus metrics
- **winston** - Structured logging
- **Docker Compose** - Monitoring stack (Prometheus, Grafana, Loki, Jaeger)

### **Testing & Quality**

- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

### **Development Tools**

- **nodemon** - Development server
- **ts-node** - TypeScript execution
- **pm2** - Production process manager
- **Docker** - Containerization

---

## 🏗️ Project Structure

```
rest-api-template/
├── 📁 src/                          # Source code
│   ├── 📁 client/                   # Prisma client
│   ├── 📁 config/                   # Configuration files
│   ├── 📁 controllers/              # Route controllers
│   ├── 📁 middlewares/              # Express middlewares
│   ├── 📁 models/                   # Data models
│   ├── 📁 routes/                   # API routes
│   ├── 📁 services/                 # Business logic services
│   ├── 📁 utils/                    # Utility functions
│   ├── 📁 validations/              # Input validation schemas
│   └── 📄 index.ts                  # Application entry point
├── 📁 tests/                        # Test files
│   ├── 📁 fixtures/                 # Test data fixtures
│   ├── 📁 unit/                     # Unit tests
│   └── 📁 utils/                    # Test utilities
├── 📁 docs/                         # API documentation
│   ├── 📄 README.md                 # API docs guide
│   ├── 📄 api-spec.json             # OpenAPI specification
│   └── 📄 simple-auto-generated-api-spec.json
├── 📁 scripts/                      # Build and utility scripts
├── 📁 prisma/                       # Database schema and migrations
├── 📁 docker/                       # Docker configurations
├── 📁 .github/                      # GitHub workflows
├── 📄 package.json                  # Dependencies and scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 Dockerfile                    # Production Docker image
├── 📄 docker-compose.*.yml         # Docker Compose configurations
└── 📄 README.md                     # This file
```

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/your-org/rest-api-template.git
cd rest-api-template

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
pnpm dev
```

### **Environment Variables**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_EXPIRE="15m"
JWT_REFRESH_EXPIRE="7d"

# Server
PORT=8000
NODE_ENV="development"

# API Keys
API_KEY_SECRET="your-api-key-secret"
API_KEY_EXPIRE="365d"
```

---

## ⚙️ Development Methodology

### **🎯 Development Philosophy**

This template follows **enterprise-grade development practices**:

1. **🔒 Security First**: Every feature is built with security in mind
2. **📊 Observability**: Comprehensive monitoring and logging
3. **🧪 Test-Driven**: Testing is integral, not optional
4. **📝 Documentation**: Auto-generated and always up-to-date
5. **🚀 Performance**: Optimized for production workloads

### **🔄 Development Workflow**

```mermaid
graph LR
    A[Feature Branch] --> B[Write Tests]
    B --> C[Implement Code]
    C --> D[Add Documentation]
    D --> E[Run Linting]
    E --> F[Run Tests]
    F --> G[Commit Changes]
    G --> H[Create PR]
    H --> I[Code Review]
    I --> J[Merge to Main]
    J --> K[Auto Deploy]
```

### **📋 Code Review Standards**

- ✅ **Security Review**: Check for vulnerabilities
- ✅ **Performance Review**: Analyze query efficiency
- ✅ **Documentation Review**: Ensure proper JSDoc comments
- ✅ **Test Coverage**: Minimum 80% coverage required
- ✅ **Type Safety**: Strict TypeScript compliance

---

## 📝 Code Structure & Standards

### **🏗️ Layered Architecture**

```
📦 Request → 🛡️ Middleware → 🎯 Controller → 🔧 Service → 🗄️ Database
```

#### **1. Controllers (`src/controllers/`)**

Handle HTTP requests and responses:

```typescript
// Example: user.controller.ts
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
```

#### **2. Services (`src/services/`)**

Business logic and data operations:

```typescript
// Example: user.service.ts
export const createUser = async (userData: CreateUserInput) => {
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exists');
  }

  const user = await prisma.user.create({ data: userData });
  return user;
};
```

#### **3. Middlewares (`src/middlewares/`)**

Request processing and security:

```typescript
// Example: auth.middleware.ts
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'No token provided');
  }

  const decoded = verifyToken(token);
  req.user = decoded;
  next();
};
```

### **📝 Coding Standards**

#### **TypeScript Configuration**

- **Strict mode enabled**
- **No implicit any**
- **Explicit return types**
- **Interface definitions for all data structures**

#### **Naming Conventions**

- **Files**: `kebab-case` (e.g., `user-service.ts`)
- **Variables**: `camelCase` (e.g., `userName`)
- **Classes**: `PascalCase` (e.g., `UserService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)
- **Interfaces**: `PascalCase` with `I` prefix (e.g., `IUser`)

#### **Error Handling**

```typescript
// Use custom ApiError for application errors
throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid input data');

// Handle errors consistently
try {
  // Your code here
} catch (error) {
  if (error instanceof ApiError) {
    throw error;
  }
  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
}
```

---

## 🔐 Authentication & Security

### **🔑 JWT Authentication**

#### **Token Types**

- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration
- **API Key**: 1 year expiration

#### **Authentication Flow**

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    C->>S: Login with credentials
    S->>DB: Validate user
    DB-->>S: User data
    S->>S: Generate JWT tokens
    S-->>C: Access + Refresh tokens

    C->>S: API call with Access token
    S->>S: Validate token
    S-->>C: Protected data

    C->>S: Refresh token request
    S->>S: Validate refresh token
    S->>S: Generate new tokens
    S-->>C: New tokens
```

#### **Security Features**

- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent brute force attacks
- **Account Lockout**: After failed attempts
- **Session Management**: Device tracking
- **Audit Logging**: All authentication events

### **🛡️ Security Middleware**

```typescript
// Applied automatically in app.ts
app.use(helmet()); // Security headers
app.use(cors(config.cors)); // CORS configuration
app.use(rateLimit(config.rateLimit)); // Rate limiting
app.use(compression()); // Response compression
```

---

## 🔑 API Key Management

### **🎯 API Key Features**

- **🔒 Secure Generation**: Cryptographically strong keys
- **👥 User Association**: Each key belongs to a user
- **🔐 Permission System**: Granular permissions control
- **📊 Usage Tracking**: Monitor API key usage
- **⏰ Expiration Management**: Automatic key expiration
- **🚫 Revocation**: Immediate key deactivation

### **🔑 Permission System**

```typescript
// Permission format: "resource:action"
const permissions = [
  'users:read', // Read user data
  'users:write', // Create/update users
  'users:delete', // Delete users
  'analytics:read', // Access analytics
  'admin:all', // Full admin access
];
```

### **📝 API Key Usage**

#### **Create API Key**

```typescript
POST /api/v1/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Production API Key",
  "permissions": ["users:read", "analytics:read"],
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

#### **Use API Key**

```typescript
GET /api/v1/users
X-API-Key: <api_key>
```

#### **Middleware Protection**

```typescript
import { requireApiKey, requireApiKeyPermission } from '../middlewares/apiKey.middleware';

// Require any valid API key
app.use('/api/v1/analytics', requireApiKey);

// Require specific permission
app.post('/api/v1/users', requireApiKeyPermission('users:write'));
```

---

## 📊 Monitoring & Observability

### **📈 Prometheus Metrics**

#### **HTTP Metrics**

- **Request Count**: Total HTTP requests by method, route, status
- **Request Duration**: Response time percentiles by route
- **Request Size**: Incoming request payload sizes
- **Response Size**: Outgoing response payload sizes
- **Active Connections**: Currently active connections

#### **Application Metrics**

- **Database Connections**: Active database connection pool
- **Cache Operations**: Cache hits/misses/errors
- **Authentication Events**: Login success/failure rates
- **Business Operations**: Custom business metrics
- **Error Rates**: Error percentages by type

#### **Metrics Endpoints**

```typescript
GET /metrics          # Prometheus metrics
GET /health           # Health check
GET /health/detailed  # Detailed health status
```

### **🐳 Docker Monitoring Stack**

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    ports: ['9090:9090']

  grafana:
    image: grafana/grafana:latest
    ports: ['3000:3000']

  loki:
    image: grafana/loki:latest
    ports: ['3100:3100']

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports: ['16686:16686']
```

### **📝 Structured Logging**

```typescript
// Log levels: error, warn, info, debug
logger.info('User login successful', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString(),
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  query: sqlQuery,
});
```

---

## 🧪 Testing Guidelines

### **🎯 Testing Structure**

```
tests/
├── 📁 fixtures/           # Test data
│   └── 📄 user.fixture.ts # User test data
├── 📁 unit/               # Unit tests
│   └── 📁 services/       # Service tests
├── 📁 integration/        # Integration tests
└── 📁 utils/              # Test utilities
```

### **📝 Test Examples**

#### **Service Unit Test**

```typescript
// tests/unit/services/user.service.test.ts
describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = generateTestUser();
      mockPrisma.user.create.mockResolvedValue(userData);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });
});
```

#### **API Integration Test**

```typescript
// tests/integration/auth.test.ts
describe('Authentication', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.data.tokens).toBeDefined();
    expect(response.body.data.user.email).toBe('test@example.com');
  });
});
```

### **📋 Testing Best Practices**

- **Arrange-Act-Assert**: Clear test structure
- **Mock External Dependencies**: Database, APIs, services
- **Test Coverage**: Minimum 80% coverage
- **Descriptive Names**: Test names should describe behavior
- **Test Data**: Use fixtures for consistent test data
- **Cleanup**: Clean up after each test

---

## 📚 API Documentation

### **📝 Documentation Philosophy**

This template uses **JSDoc comments** to automatically generate comprehensive API documentation. The documentation is always up-to-date because it's generated directly from the code.

### **🎯 Writing API Documentation**

#### **Route Documentation**

```typescript
/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user account with the provided data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  // Implementation
};
```

#### **Schema Documentation**

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: User unique identifier
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           description: User full name
 *           example: "John Doe"
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           description: User role
 *           example: "USER"
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether user email is verified
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *           example: "2023-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2023-01-01T00:00:00.000Z"
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - isEmailVerified
 *         - createdAt
 *         - updatedAt
 */
```

### **📚 Auto-Generation Commands**

```bash
# Generate API documentation
pnpm docs:simple-auto

# Validate documentation
pnpm docs:validate

# Watch for changes and auto-generate
pnpm docs:watch
```

### **🌐 Accessing Documentation**

#### **Development Environment**

- **Swagger UI**: http://localhost:8000/v1/docs
- **OpenAPI JSON**: http://localhost:8000/v1/docs/json
- **OpenAPI YAML**: http://localhost:8000/v1/docs/yaml

#### **Production Environment**

- **Swagger UI**: https://your-domain.com/v1/docs
- **OpenAPI JSON**: https://your-domain.com/v1/docs/json

### **📋 Documentation Standards**

- **Required Fields**: All endpoints must have `summary`, `description`, `tags`
- **Security**: Document authentication requirements
- **Request Bodies**: Complete schema with examples
- **Responses**: Document all possible response codes
- **Error Responses**: Use consistent error schema
- **Examples**: Provide realistic examples for all fields

---

## 🚀 Deployment

### **🐳 Docker Deployment**

#### **Development**

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Build and start
docker-compose -f docker-compose.dev.yml up --build
```

#### **Production**

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### **Monitoring Stack**

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Access services
# Grafana: http://localhost:4000
# Prometheus: http://localhost:9090
# Jaeger: http://localhost:16686
```

### **🚀 Production Deployment**

#### **Environment Setup**

```bash
# Set production environment
export NODE_ENV=production

# Build the application
pnpm build

# Run with PM2
pnpm start
```

#### **Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

#### **Security Checklist**

- [ ] **Environment Variables**: All secrets configured
- [ ] **Database**: Production database configured
- [ ] **SSL/TLS**: HTTPS enabled
- [ ] **Firewall**: Proper firewall rules
- [ ] **Monitoring**: Metrics and logging enabled
- [ ] **Backups**: Database backup strategy
- [ ] **Rate Limiting**: DDoS protection enabled

---

## 🔄 CI/CD Pipeline

### **🔧 GitHub Actions Workflow**

The template includes a comprehensive CI/CD pipeline with:

#### **🏗️ Build & Test**

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
      - name: Build application
        run: pnpm build
```

#### **🔍 Security Scanning**

- **CodeQL**: Static code analysis
- **Dependency Check**: Vulnerability scanning
- **Secret Scanning**: Detect exposed secrets

#### **🐳 Docker Build & Push**

```yaml
docker:
  runs-on: ubuntu-latest
  steps:
    - name: Build Docker image
      run: docker build -t my-api:${{ github.sha }} .
    - name: Push to registry
      run: docker push my-api:${{ github.sha }}
```

#### **🚀 Deployment**

- **Staging**: Automatic deployment to staging
- **Production**: Manual approval required
- **Rollback**: Automatic rollback on failure

### **📋 Pipeline Stages**

1. **🔍 Code Quality**
   - ESLint checks
   - Prettier formatting
   - TypeScript compilation

2. **🧪 Testing**
   - Unit tests
   - Integration tests
   - Coverage reports

3. **🔒 Security**
   - Vulnerability scanning
   - Dependency checks
   - Code analysis

4. **🏗️ Build**
   - TypeScript compilation
   - Docker image build
   - Artifact generation

5. **🚀 Deploy**
   - Staging deployment
   - Health checks
   - Production deployment

---

## 🛠️ Development Workflow

### **🌱 Starting a New Feature**

```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Install dependencies (if needed)
pnpm install

# 3. Start development server
pnpm dev

# 4. Make changes...

# 5. Run tests
pnpm test

# 6. Run linting
pnpm lint

# 7. Generate documentation
pnpm docs:simple-auto

# 8. Commit changes
git add .
git commit -m "feat: add user authentication"

# 9. Push and create PR
git push origin feature/user-authentication
```

### **📝 Adding New API Endpoints**

#### **1. Create Validation Schema**

```typescript
// src/validations/user.validation.ts
export const createUserSchema = {
  body: Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),
};
```

#### **2. Create Controller**

```typescript
// src/controllers/user.controller.ts
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
```

#### **3. Create Service**

```typescript
// src/services/user.service.ts
export const createUser = async (userData: CreateUserInput) => {
  // Business logic here
};
```

#### **4. Add Route**

```typescript
// src/routes/user.routes.ts
import { createUser } from '../controllers/user.controller';
import { createUserSchema } from '../validations/user.validation';
import { validate } from '../middlewares/validation.middleware';

router.post('/users', validate(createUserSchema), createUser);
```

#### **5. Add Documentation**

```typescript
/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 */
```

#### **6. Add Tests**

```typescript
// tests/unit/services/user.service.test.ts
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Test implementation
    });
  });
});
```

### **🔧 Database Changes**

#### **1. Update Schema**

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  // Add new fields here
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### **2. Generate Migration**

```bash
npx prisma migrate dev --name add-new-fields
```

#### **3. Update Types**

```bash
npx prisma generate
```

#### **4. Update Tests**

```typescript
// Update test fixtures and mocks
```

---

## 📋 Best Practices

### **🔒 Security Best Practices**

#### **Authentication**

- ✅ Use JWT with short expiration times
- ✅ Implement refresh token rotation
- ✅ Store secrets in environment variables
- ✅ Use HTTPS in production
- ✅ Implement rate limiting

#### **Data Validation**

- ✅ Validate all input data
- ✅ Use parameterized queries
- ✅ Sanitize user input
- ✅ Implement content security policy

#### **API Security**

- ✅ Use API keys for programmatic access
- ✅ Implement RBAC (Role-Based Access Control)
- ✅ Log all authentication events
- ✅ Monitor for suspicious activity

### **🚀 Performance Best Practices**

#### **Database**

- ✅ Use database indexes
- ✅ Implement connection pooling
- ✅ Use transactions for complex operations
- ✅ Optimize queries with Prisma

#### **Caching**

- ✅ Cache frequently accessed data
- ✅ Use Redis for session storage
- ✅ Implement cache invalidation
- ✅ Monitor cache hit rates

#### **API Design**

- ✅ Use pagination for large datasets
- ✅ Implement response compression
- ✅ Use appropriate HTTP status codes
- ✅ Limit response payload sizes

### **📝 Code Quality**

#### **TypeScript**

- ✅ Use strict mode
- ✅ Define interfaces for all data structures
- ✅ Avoid `any` type
- ✅ Use proper type annotations

#### **Error Handling**

- ✅ Use custom error classes
- ✅ Implement global error handler
- ✅ Log errors with context
- ✅ Provide meaningful error messages

#### **Testing**

- ✅ Write tests before code (TDD)
- ✅ Achieve 80%+ code coverage
- ✅ Test error scenarios
- ✅ Use realistic test data

---

## 🤝 Contributing

### **📋 Contribution Guidelines**

1. **🌱 Fork the repository**
2. **🌿 Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **📝 Follow coding standards**
4. **🧪 Add tests for new features**
5. **📚 Update documentation**
6. **✅ Ensure all tests pass**
7. **🚀 Commit your changes** (`git commit -m 'feat: add amazing feature'`)
8. **📤 Push to branch** (`git push origin feature/amazing-feature`)
9. **🔄 Create a Pull Request**

### **📝 Commit Message Standards**

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples:**

```
feat(auth): add API key authentication
fix(user): resolve email validation bug
docs(api): update authentication documentation
test(user): add user service unit tests
```

### **🔍 Code Review Process**

1. **📋 Automated Checks**
   - All tests pass
   - Code coverage > 80%
   - No linting errors
   - TypeScript compilation successful

2. **👥 Manual Review**
   - Security review
   - Performance review
   - Documentation review
   - Architecture review

3. **✅ Approval Requirements**
   - At least one team member approval
   - All automated checks pass
   - Documentation updated

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### **📜 MIT License Summary**

- ✅ **Commercial use**: You can use this template for commercial projects
- ✅ **Modification**: You can modify the code
- ✅ **Distribution**: You can distribute the code
- ✅ **Private use**: You can use privately
- ❌ **Liability**: No warranty provided
- ❌ **Trademark**: No trademark rights

---

## 🎯 Support & Community

### **🆘 Getting Help**

- **📖 Documentation**: Check this README first
- **🐛 Issues**: [Create an issue](https://github.com/your-org/rest-api-template/issues)
- **💬 Discussions**: [Join discussions](https://github.com/your-org/rest-api-template/discussions)
- **📧 Email**: support@your-agency.com

### **🏆 Contributing to the Template**

We welcome contributions! Please see the [Contributing Guide](#-contributing) section above.

### **📚 Additional Resources**

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

## 🎉 Acknowledgments

- **🙏 Thanks** to all contributors who helped improve this template
- **🚀 Built** with modern web technologies and best practices
- **💚 Maintained** by your agency development team

---

**🚀 Ready to build amazing APIs? Start with this template and accelerate your development!**

---

_Last updated: March 28, 2026_
