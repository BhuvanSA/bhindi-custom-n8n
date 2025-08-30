# Bhindi Agent Starter Kit

A TypeScript-based agent starter kit that demonstrates **comprehensive n8n management tools** with authentication. Perfect for learning agent development with the [Bhindi.io](https://bhindi.io) specification for managing your n8n automation platform.

# What is Bhindi?
Bhindi lets you talk to your apps like you talk to a friend.
Bhindi supports 100+ integrations and is the easiest way to build AI agents.

Check a list of integrations available at [Bhindi Agents Directory](https://directory.bhindi.io/)

## 📚 Documentation

For comprehensive documentation on building agents, visit the [Bhindi Documentation](https://github.com/upsurgeio/bhindi-docs).

## 🎯 What This Starter Kit Demonstrates

This starter kit teaches you how to build agents with:
- **Complete n8n Management** (Full n8n API coverage with authentication)
- **Workflow Management** (Create, update, delete, activate/deactivate workflows)
- **Credential Management** (Secure credential creation and management)
- **User & Project Management** (Team collaboration and access control)
- **Execution Monitoring** (Track and manage workflow executions)
- **Advanced authentication patterns** with Bearer tokens
- **Proper parameter validation** using JSON Schema
- **Advanced features** like `confirmationRequired`
- **Standardized response formats** following agent specification

## ✨ Features

### n8n Management Tools (Authentication Required)
- **Security & Auditing**: Generate comprehensive security audits for your n8n instance
- **Workflow Management**: Complete CRUD operations for workflows with advanced features
- **Credential Management**: Secure creation and management of credentials for various integrations
- **Execution Monitoring**: Track, retrieve, and manage workflow executions
- **Tag Management**: Organize workflows and resources with tags
- **User Management**: Full user lifecycle management with role-based access control
- **Project Management**: Team collaboration with project-based organization
- **Variable Management**: Environment variable management for workflows
- **Source Control**: Git integration for version control

### Development Features
- **Full TypeScript support** with strict typing
- **Comprehensive testing** with Jest
- **ESLint + Prettier** for code quality
- **JSON Schema validation** for parameters
- **Standardized error handling**

## 🚀 Available Tools

### Security & Auditing Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_generateAudit` | Generate security audit for n8n instance | `confirmationRequired: true` |

### Credential Management Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_createCredential` | Create credentials for n8n nodes | `confirmationRequired: true` |
| `customn8n_deleteCredential` | Delete credentials from instance | `confirmationRequired: true` |
| `customn8n_getCredentialType` | Get credential data schema | Schema validation |
| `customn8n_transferCredential` | Transfer credential to another project | `confirmationRequired: true` |

### Workflow Management Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_createWorkflow` | Create new workflow with nodes and connections | `confirmationRequired: true` |
| `customn8n_getWorkflows` | Retrieve all workflows from instance | Filtering & pagination |
| `customn8n_getWorkflow` | Get specific workflow by ID | Optional pinned data exclusion |
| `customn8n_updateWorkflow` | Update existing workflow | Complex node management |
| `customn8n_deleteWorkflow` | Delete workflow from instance | `confirmationRequired: true` |
| `customn8n_activateWorkflow` | Activate workflow for execution | `confirmationRequired: true` |
| `customn8n_deactivateWorkflow` | Deactivate workflow | `confirmationRequired: true` |
| `customn8n_transferWorkflow` | Transfer workflow to another project | `confirmationRequired: true` |

### Execution Management Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_getExecutions` | Retrieve workflow executions | Status filtering & pagination |
| `customn8n_getExecution` | Get specific execution details | Optional detailed data |
| `customn8n_deleteExecution` | Delete execution from instance | `confirmationRequired: true` |

### Tag Management Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_createTag` | Create organizational tags | `confirmationRequired: true` |
| `customn8n_getTags` | Retrieve all tags | Pagination support |
| `customn8n_getTag` | Get specific tag by ID | Individual tag details |
| `customn8n_updateTag` | Update tag information | `confirmationRequired: true` |
| `customn8n_deleteTag` | Delete tag from instance | `confirmationRequired: true` |
| `customn8n_getWorkflowTags` | Get tags associated with workflow | Workflow organization |
| `customn8n_updateWorkflowTags` | Update workflow tag associations | `confirmationRequired: true` |

### User Management Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_getUsers` | Retrieve all users from instance | Role inclusion & project filtering |
| `customn8n_createUsers` | Create one or more users | Bulk user creation |
| `customn8n_getUser` | Get specific user details | Role information optional |
| `customn8n_deleteUser` | Delete user from instance | `confirmationRequired: true` |
| `customn8n_changeRole` | Change user's global role | `confirmationRequired: true` |

### Project Management Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_createProject` | Create new project | `confirmationRequired: true` |
| `customn8n_getProjects` | Retrieve all projects | Pagination support |
| `customn8n_updateProject` | Update project information | `confirmationRequired: true` |
| `customn8n_deleteProject` | Delete project from instance | `confirmationRequired: true` |
| `customn8n_addUsersToProject` | Add users to project with roles | `confirmationRequired: true` |
| `customn8n_deleteUserFromProject` | Remove user from project | `confirmationRequired: true` |
| `customn8n_changeUserRoleInProject` | Change user's project role | `confirmationRequired: true` |

### Variable Management Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_createVariable` | Create environment variable | `confirmationRequired: true` |
| `customn8n_getVariables` | Retrieve all variables | Pagination support |
| `customn8n_updateVariable` | Update variable value | `confirmationRequired: true` |
| `customn8n_deleteVariable` | Delete variable | `confirmationRequired: true` |

### Source Control Tools

| Tool | Description | Special Features |
|------|-------------|------------------|
| `customn8n_pull` | Pull changes from remote repository | `confirmationRequired: true` |

## 📋 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Start the Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 4. Test the API
```bash
# Get available tools
curl -X GET "http://localhost:3000/tools"

# Test security audit (requires n8n API token)
curl -X POST "http://localhost:3000/tools/customn8n_generateAudit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{
    "additionalOptions": {
      "daysAbandonedWorkflow": 30,
      "categories": ["credentials", "workflows", "nodes"]
    }
  }'

# Test workflow retrieval
curl -X POST "http://localhost:3000/tools/customn8n_getWorkflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{"limit": 10, "active": true}'
```

## 🧮 Usage Examples

### Workflow Management (Authentication Required)

```bash
# Create a simple workflow
curl -X POST "http://localhost:3000/tools/customn8n_createWorkflow" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{
    "name": "My Test Workflow",
    "nodes": [
      {
        "id": "start-node",
        "name": "Start",
        "type": "n8n-nodes-base.start",
        "position": [100, 100],
        "parameters": {}
      }
    ],
    "connections": {},
    "settings": {
      "executionOrder": "v1"
    }
  }'

# Get all workflows
curl -X POST "http://localhost:3000/tools/customn8n_getWorkflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{"limit": 5, "active": true}'

# Activate a workflow
curl -X POST "http://localhost:3000/tools/customn8n_activateWorkflow" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{"id": "workflow-id-here"}'
```

### Credential Management

```bash
# Create a credential
curl -X POST "http://localhost:3000/tools/customn8n_createCredential" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{
    "name": "My GitHub Credential",
    "type": "github",
    "data": {
      "accessToken": "your-github-token"
    }
  }'

# Get credential schema
curl -X POST "http://localhost:3000/tools/customn8n_getCredentialType" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{"credentialTypeName": "github"}'
```

### User and Project Management

```bash
# Create a new user
curl -X POST "http://localhost:3000/tools/customn8n_createUsers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{
    "users": [
      {
        "email": "newuser@example.com",
        "role": "global:member"
      }
    ]
  }'

# Create a project
curl -X POST "http://localhost:3000/tools/customn8n_createProject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{"name": "Marketing Automation Project"}'

# Add user to project
curl -X POST "http://localhost:3000/tools/customn8n_addUsersToProject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{
    "projectId": "project-id-here",
    "relations": [
      {
        "projectUserId": "user-id-here",
        "role": "project:admin"
      }
    ]
  }'
```

### Execution Monitoring

```bash
# Get workflow executions
curl -X POST "http://localhost:3000/tools/customn8n_getExecutions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{
    "limit": 10,
    "status": "success",
    "includeData": false
  }'

# Get specific execution details
curl -X POST "http://localhost:3000/tools/customn8n_getExecution" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_N8N_API_TOKEN" \
  -d '{
    "id": 123,
    "includeData": true
  }'
```

## 🔐 Authentication

This agent demonstrates **n8n API authentication**:

- **All n8n tools**: Bearer token authentication required (your n8n API token)
- **Comprehensive access**: Full n8n instance management capabilities
- **Security focused**: Proper token validation and secure API communication

To learn more about authentication, check out the [Bhindi.io Agent Documentation](https://github.com/upsurgeio/bhindi-docs#-authentication)

## 📚 API Endpoints

- `GET /tools` - Get list of available tools (public)
- `POST /tools/:toolName` - Execute a specific tool (auth depends on tool type)
- `GET /health` - Health check endpoint (shows tool authentication requirements)
- `GET /docs` - Swagger UI documentation (serves `public/swagger.json`)

## 📖 Documentation & Examples

- **[Complete API Examples](examples.md)** - Detailed usage examples for all n8n management tools with curl commands
- **Swagger Documentation** - Available at `/docs` endpoint when server is running  
- **Postman Collection** - Import `Bhindi-Agent-n8n.postman_collection.json` for easy testing

## 🏗️ Project Structure

```
src/
├── config/
│   └── tools.json          # n8n tool definitions with JSON Schema
├── controllers/
│   └── appController.ts    # Handles n8n API operations
├── services/
│   ├── calculatorService.ts # Legacy - can be removed
│   ├── githubService.ts     # Legacy - can be removed  
│   └── n8nService.ts        # n8n API integration service
├── routes/
│   ├── toolsRoutes.ts      # GET /tools endpoint
│   └── appRoutes.ts        # POST /tools/:toolName endpoint
├── middlewares/
│   ├── auth.ts             # Authentication utilities
│   └── errorHandler.ts     # Error handling middleware
├── types/
│   └── agent.ts            # Response type definitions
├── __tests__/
│   └── n8nService.test.ts  # Comprehensive n8n tests
├── app.ts                  # Express app configuration
└── server.ts              # Server entry point
```

## 🧪 Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Development server with auto-reload
npm run dev
```

## 🎓 Learning Objectives

This starter kit teaches you:

1. **n8n Integration**: How to build comprehensive n8n management tools
2. **Authentication Patterns**: Bearer token authentication for API access
3. **Parameter Validation**: JSON Schema validation patterns for complex objects
4. **Error Handling**: Proper error responses and status codes
5. **Response Formats**: Standardized success/error responses
6. **Testing**: Comprehensive test coverage patterns
7. **Tool Features**: `confirmationRequired`, parameter types, complex workflows
8. **API Design**: RESTful API patterns for automation platform management

## 🔧 Advanced Features Demonstrated

- **confirmationRequired**: Critical operations like workflow deletion, user management
- **Parameter validation**: Complex object validation for workflows, nodes, and connections
- **Enum parameters**: Status filtering, role management, execution states
- **Default values**: Optional parameters with sensible defaults
- **Error handling**: Comprehensive validation and API error responses
- **Pagination support**: Cursor-based pagination for large datasets
- **Complex object structures**: Workflow nodes, connections, and settings management

## 🚀 Next Steps

Once you understand this agent, you can:

1. **Add more n8n integrations**: Custom nodes, advanced workflow templates
2. **Add other automation platforms**: Zapier, Microsoft Power Automate
3. **Implement webhook handling**: Real-time workflow triggers and notifications  
4. **Add advanced monitoring**: Performance metrics, execution analytics
5. **Add database integration**: Store execution history, user preferences
6. **Build workflow templates**: Pre-built automation solutions
7. **Add AI integration**: Intelligent workflow suggestions and optimization

## 📖 Agent Specification Compliance

This starter follows the [Bhindi.io](https://bhindi.io) agent specification:
- ✅ Required endpoints: `GET /tools`, `POST /tools/:toolName`
- ✅ Standardized response formats: `BaseSuccessResponseDto`, `BaseErrorResponseDto`
- ✅ JSON Schema parameter validation
- ✅ Tool confirmation
- ✅ Authentication patterns (Bearer tokens)
- ✅ Proper error handling and status codes

Perfect for learning how to build production-ready agents! 🎉

## Need Help?

We're here for you! You can reach out to us at:

- **Email**: [info@bhindi.io](mailto:info@bhindi.io)
- **Twitter/X**: [@bhindiai](https://x.com/bhindiai) for the latest updates
- **Discord**: [Join our community](https://discord.gg/hSfTG33ymy)
- **Documentation**: [Bhindi Docs](https://github.com/upsurgeio/bhindi-docs)
- **Website**: [Bhindi.io](https://bhindi.io)
