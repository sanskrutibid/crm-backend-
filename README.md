# CRM APP Backend 🚀

### 🏢 Developed & Maintained by **[Phian Infotech](https://phianinfotec.com/)**

An industry-standard, high-performance CRM (Customer Relationship Management) backend application built with **NestJS v11** and the **Fastify** adapter for ultra-fast, low-latency API response times. 

It implements a clean modular architecture, MongoDB integrations (via Mongoose), strict class-validators, standardized response interceptors, and a dynamic Swagger interface where **all schema documentation is kept entirely within DTOs to keep controllers clean and highly reusable**.

---

## 🛠️ Tech Stack & Key Features

* **Framework Engine**: [NestJS](https://nestjs.com/) with [Fastify](https://www.fastify.io/) for high-concurrency capability.
* **Database Layer**: MongoDB utilizing [Mongoose](https://mongoosejs.com/) schemas.
* **Documentation**: Dynamic [Swagger API Docs](https://swagger.io/) setup.
* **Authentication**: High-performance stateless JWT guards.
* **Validation**: Robust request sanitization and parsing via `class-validator` and `class-transformer`.
* **Security & Compression**: Integrated `@fastify/helmet` (headers) and `@fastify/compress` (gzip/deflate).
* **Architecture**: Clean modular design separating concerns between filters, interceptors, modules, and DTO structures.

---

## 📁 Project Architecture & Directory Layout

```text
crm_app_Backend/
├── src/
│   ├── common/                       # Shared utilities, decorators, interceptors, and filters
│   │   ├── decorators/
│   │   │   └── response-message.decorator.ts # Custom success message metadata decorator
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts      # Standardized exception handler (unified error envelope)
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts      # Standardized API response formatter (unified success envelope)
│   │   └── dto/
│   │       └── api-response.dto.ts           # Swagger schemas for standard response envelopes
│   ├── modules/                      # Functional Domain Modules
│   │   ├── auth/                     # Authentication & Access Control
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts              # Login schema & validation
│   │   │   │   ├── register.dto.ts           # Registration schema & validation
│   │   │   │   └── auth-response.dto.ts      # Auth Response schema for Swagger
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts         # Fast stateless Bearer JWT authorization guard
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   └── auth.service.ts
│   │   ├── users/                    # CRM Users management
│   │   │   ├── schemas/
│   │   │   │   └── user.schema.ts            # Mongoose User model with pre-save bcrypt hashing
│   │   │   ├── users.module.ts
│   │   │   └── users.service.ts
│   │   └── leads/                    # CRM Core: Leads Management
│   │       ├── dto/
│   │       │   ├── create-lead.dto.ts        # Validate & Document lead creation parameters
│   │       │   ├── update-lead.dto.ts        # Validate & Document lead modification parameters
│   │       │   ├── lead-response.dto.ts      # Model returned leads structures for Swagger docs
│   │       │   └── query-lead.dto.ts         # Handles query filters & paginated page searches
│   │       ├── schemas/
│   │       │   └── lead.schema.ts            # Mongoose Lead schema with status enums
│   │       ├── leads.controller.ts
│   │       ├── leads.module.ts
│   │       └── leads.service.ts
│   ├── app.module.ts                 # Main root module connecting MongoDB & active domains
│   └── main.ts                       # Entrypoint bootstrapping Fastify engine, guards & documentation
```

---

## 🛢️ Environment Setup (`.env`)

Configure the environment variables in a `.env` file at the root of the project:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/crm_app
JWT_SECRET=your_secret_key
API_PREFIX=api
```

---

## 🌐 Unified Response Contracts

### 1. Success Response Envelope (Formed by `TransformInterceptor`)
All successful HTTP requests yield a status code wrapped inside this layout:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lead details retrieved successfully",
  "data": {
    "id": "60d5ed7ab394142e88a38c29",
    "companyName": "Acme Corp",
    "contactName": "Alice Smith",
    "email": "alice@acmecorp.com",
    "phone": "+1-555-0199",
    "status": "NEW",
    "value": 15000,
    "notes": "Met at TechSummit 2026.",
    "assignedTo": {
      "id": "60d5ecb8b394142e88a38c21",
      "email": "agent@crmapp.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "AGENT"
    },
    "createdAt": "2026-05-26T14:04:03.000Z",
    "updatedAt": "2026-05-26T14:04:03.000Z"
  }
}
```

### 2. Error Response Envelope (Formed by `HttpExceptionFilter`)
All runtime errors or bad requests return structured messages:
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "Please enter a valid email address",
    "Company name is required"
  ],
  "error": "Bad Request",
  "timestamp": "2026-05-26T08:36:20.000Z",
  "path": "/api/v1/leads"
}
```

---

## 🏃 Setup & Run Instructions

Ensure your MongoDB instance is running locally or provide a valid URI in `.env`.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Server
* **Development Mode (Auto-reload / watch)**:
  ```bash
  npm run start:dev
  ```
* **Production Mode**:
  ```bash
  npm run start:prod
  ```

---

## 📖 Swagger Interactive Documentation

Once the backend starts, visit the interactive interface:
🔗 **[http://localhost:3000/docs](http://localhost:3000/docs)**

*All field properties, validation rules, examples, and descriptions are automatically populated directly from the respective DTO files (like `LoginDto` or `CreateLeadDto`), leaving the Controllers exceptionally clean, light, and easy to maintain.*

### Authentication Workflow on Swagger:
1. Execute the `/api/v1/auth/register` or `/api/v1/auth/login` endpoint.
2. Copy the returned `accessToken` string in `data.accessToken`.
3. Click the green **"Authorize"** button at the top-right of the Swagger page.
4. Select the `JWT` (Bearer) security definition, paste the token, and click **Authorize**.
5. All protected `/leads` endpoints are now fully accessible inside Swagger!

---

## 🏢 About Phian Infotech

This CRM Backend repository is engineered and maintained by **[Phian Infotech](https://phianinfotec.com/)**. We build scalable, high-performance web applications, API services, and enterprise-grade solutions tailored for modern businesses.

For inquiries, support, or custom software development, feel free to reach out or visit our official website.