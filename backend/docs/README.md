# API Documentation

This directory contains the auto-generated API documentation for the Prisma Express TypeScript Boilerplate.

## Overview

The API documentation is automatically generated using [Swagger/OpenAPI 3.0](https://swagger.io/specification/) and is served through Swagger UI. The documentation is kept up-to-date automatically through JSDoc comments in the route files.

## Accessing the Documentation

### Development

- **Swagger UI**: http://localhost:8000/v1/docs
- **OpenAPI JSON**: http://localhost:8000/v1/docs/json
- **OpenAPI YAML**: http://localhost:8000/v1/docs/yaml

### Production

- **Swagger UI**: https://your-domain.com/v1/docs
- **OpenAPI JSON**: https://your-domain.com/v1/docs/json
- **OpenAPI YAML**: https://your-domain.com/v1/docs/yaml

## Documentation Structure

### Components

- **Schemas**: Data models and request/response structures
- **Responses**: Standardized API responses
- **Security Schemes**: Authentication methods

### Tags

- **Auth**: Authentication and authorization endpoints
- **Users**: User management operations
- **Health**: Health check and system status

## Available Scripts

### Generate Documentation

```bash
# Generate static API specification
pnpm docs:generate

# Validate documentation syntax
pnpm docs:validate

# Serve documentation with auto-reload
pnpm docs:serve
```

### Integration with Development Workflow

The documentation is automatically validated during:

- Pre-commit hooks
- CI/CD pipelines
- Build process

## Adding New Endpoints

To document a new endpoint, add JSDoc comments above your route definitions:

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *         description: Parameter description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchemaName'
 *     responses:
 *       "200":
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseSchema'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
```

## Schema Definitions

### User Schema

```yaml
User:
  type: object
  properties:
    id:
      type: integer
      example: 1
    email:
      type: string
      format: email
      example: 'user@example.com'
    name:
      type: string
      example: 'John Doe'
    role:
      type: string
      enum: [USER, ADMIN]
      example: 'USER'
    isEmailVerified:
      type: boolean
      example: true
    createdAt:
      type: string
      format: date-time
      example: '2023-01-01T00:00:00.000Z'
    updatedAt:
      type: string
      format: date-time
      example: '2023-01-01T00:00:00.000Z'
```

### Authentication Tokens

```yaml
AuthTokens:
  type: object
  properties:
    access:
      $ref: '#/components/schemas/Token'
    refresh:
      $ref: '#/components/schemas/Token'
```

## Response Codes

### Standard Responses

- **200**: Success
- **201**: Created
- **204**: No Content
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **500**: Internal Server Error
- **503**: Service Unavailable

## Best Practices

### Documentation Standards

1. **Be Descriptive**: Provide clear, concise descriptions
2. **Use Examples**: Include realistic example data
3. **Document Errors**: Always document possible error responses
4. **Keep Updated**: Update documentation when API changes
5. **Use References**: Reference schemas and responses for consistency

### Code Organization

1. **Group by Tags**: Organize endpoints by functionality
2. **Consistent Naming**: Use consistent naming conventions
3. **Schema Reuse**: Reuse schemas across endpoints
4. **Version Control**: Include documentation in version control

## Testing Documentation

### Manual Testing

1. Start the development server: `pnpm dev`
2. Navigate to http://localhost:8000/v1/docs
3. Test endpoints using the "Try it out" feature
4. Verify request/response schemas

### Automated Testing

```bash
# Validate documentation syntax
pnpm docs:validate

# Run tests that verify API behavior
pnpm test
```

## Integration with External Tools

### Postman

- Import OpenAPI specification from `/v1/docs/json`
- Generate Postman collections automatically

### Insomnia

- Import OpenAPI specification from `/v1/docs/json`
- Auto-generate request templates

### API Testing Tools

- Use the OpenAPI specification for automated API testing
- Generate client SDKs in various languages

## Troubleshooting

### Common Issues

1. **Documentation not updating**
   - Restart the development server
   - Clear browser cache
   - Check for syntax errors in JSDoc comments

2. **Swagger UI not loading**
   - Verify all dependencies are installed
   - Check console for JavaScript errors
   - Ensure routes are properly configured

3. **Schema validation errors**
   - Run `pnpm docs:validate` to identify issues
   - Check YAML syntax in `src/docs/components.yml`
   - Verify schema references are correct

### Getting Help

- Check the [Swagger documentation](https://swagger.io/docs/)
- Review existing endpoint documentation for examples
- Run validation scripts to identify specific issues

## Contributing

When contributing to the API documentation:

1. Follow the existing documentation patterns
2. Add comprehensive examples
3. Include all possible response codes
4. Test the documentation manually
5. Run validation scripts before committing

## Version History

- **v1.0.0**: Initial API documentation setup
- **v1.1.0**: Enhanced schemas and responses
- **v1.2.0**: Added health check endpoint documentation
- **v1.3.0**: Improved validation and generation scripts
