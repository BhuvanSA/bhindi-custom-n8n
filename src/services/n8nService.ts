import { BaseErrorResponseDto } from '@/types/agent';

/**
 * n8n Service
 * Handles interactions with the n8n workflow automation tool
 */
export class N8nService {
  private readonly baseUrl = 'http://localhost:5678/api/v1';

  /**
   * Private helper to make authenticated requests to the n8n API.
   * Handles common error patterns and headers.
   */
  private async _request(
    token: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    options: {
      query?: Record<string, any>;
      body?: Record<string, any>;
      timeoutMs?: number;
    } = {}
  ): Promise<any> {
    const timeoutMs = options.timeoutMs ?? 10_000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = new URL(`${this.baseUrl}${path}`);

      // Append query parameters if they exist
      if (options.query) {
        for (const key in options.query) {
          const value = options.query[key];
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value.toString());
          }
        }
      }

      // Always use X-N8N-API-KEY (Bearer tokens no longer supported)

      const headers: HeadersInit = {
        Accept: 'application/json',
        'User-Agent': 'Bhindi-Agent-Starter/1.0',
        'X-N8N-API-KEY': token,
      };

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (options.body) {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url.toString(), fetchOptions);

      // Handle 204 No Content responses for DELETE/PUT/PATCH
      if (response.status === 204) {
        return { success: true, message: 'Operation successful.' };
      }

      if (!response.ok) {
        // Try to get detailed error information from n8n response
        let errorBody: any = {};
        let errorText = '';
        try {
          errorText = await response.text();
          try {
            errorBody = JSON.parse(errorText);
          } catch {
            errorBody = { raw: errorText };
          }
        } catch {
          errorBody = { raw: 'Failed to read error response' };
        }

        // Build comprehensive error details for the AI model
        const errorDetails = {
          endpoint: path,
          method,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responseBody: errorBody,
          requestBody: options.body || null,
          queryParams: options.query || null,
          timestamp: new Date().toISOString(),
        };

        // Handle specific error cases with detailed guidance
        if (response.status === 401) {
          throw new BaseErrorResponseDto(
            'Authentication failed with n8n API',
            401,
            `AUTHENTICATION ERROR: The provided API key is invalid, expired, or missing. Please verify:
              1. API key is correct and active
              2. API key has proper format (check n8n documentation)
              3. n8n instance is running and accessible
              4. API endpoint URL is correct: ${this.baseUrl}
              Endpoint attempted: ${path}
              Response: ${JSON.stringify(errorBody, null, 2)}`
          );
        }

        if (response.status === 403) {
          throw new BaseErrorResponseDto(
            'Permission denied or rate limit exceeded',
            403,
            `ACCESS DENIED: The operation was forbidden. Possible causes:
              1. API key lacks required permissions for this operation
              2. Rate limit exceeded - wait before retrying
              3. Resource access restrictions
              4. n8n instance configuration prevents this action
              Endpoint: ${path}
              Required permissions may include: workflow management, user management, or admin access
              Response details: ${JSON.stringify(errorBody, null, 2)}`
          );
        }

        if (response.status === 404) {
          throw new BaseErrorResponseDto(
            'Resource not found',
            404,
            `RESOURCE NOT FOUND: The requested resource does not exist. Check:
              1. Resource ID is correct and exists
              2. Resource hasn't been deleted
              3. You have permission to access this resource
              4. n8n instance contains the expected data
              Endpoint: ${path}
              Request parameters: ${JSON.stringify(options.query || {}, null, 2)}
              Response: ${JSON.stringify(errorBody, null, 2)}`
          );
        }

        if (response.status === 400) {
          const validationErrors = errorBody.errors || errorBody.details || [];
          throw new BaseErrorResponseDto(
            'Invalid request parameters',
            400,
            `VALIDATION ERROR: The request contains invalid data. Fix these issues:
              ${
                validationErrors.length > 0
                  ? validationErrors
                      .map(
                        (err: any, i: number) =>
                          `${i + 1}. ${typeof err === 'string' ? err : JSON.stringify(err)}`
                      )
                      .join('\n')
                  : 'Check parameter format, required fields, and data types'
              }
              Endpoint: ${path}
              Request body: ${JSON.stringify(options.body, null, 2)}
              Query params: ${JSON.stringify(options.query, null, 2)}
              Server response: ${JSON.stringify(errorBody, null, 2)}`
          );
        }

        if (response.status === 422) {
          throw new BaseErrorResponseDto(
            'Unprocessable entity - business logic validation failed',
            422,
            `BUSINESS LOGIC ERROR: The request is syntactically correct but violates business rules:
              ${errorBody.message || 'Unknown validation error'}
              Common issues:
                1. Dependencies not met (e.g., trying to delete a resource in use)
                2. State conflicts (e.g., activating already active workflow)
                3. Data constraints violated
                Endpoint: ${path}
              Full error details: ${JSON.stringify(errorBody, null, 2)}`
          );
        }

        if (response.status === 500) {
          throw new BaseErrorResponseDto(
            'Internal server error in n8n',
            500,
            `SERVER ERROR: n8n encountered an internal error. This usually indicates:
              1. n8n instance issues (check n8n logs)
              2. Database connectivity problems
              3. Resource exhaustion (memory, disk space)
              4. Configuration errors in n8n
              Endpoint: ${path}
              Error response: ${JSON.stringify(errorBody, null, 2)}
              Recommend checking n8n instance health and logs`
          );
        }

        // Generic error for other status codes
        const errorMessage =
          errorBody.message || errorBody.error || `HTTP ${response.status} ${response.statusText}`;
        throw new BaseErrorResponseDto(
          `n8n API error: ${errorMessage}`,
          response.status,
          `UNEXPECTED ERROR (${response.status}): 
            Endpoint: ${path}
            Method: ${method}
            Request details: ${JSON.stringify(
              {
                body: options.body,
                query: options.query,
              },
              null,
              2
            )}
            Response: ${JSON.stringify(errorBody, null, 2)}
            Full error context: ${JSON.stringify(errorDetails, null, 2).slice(0, 1000)}`
        );
      }

      // Attempt JSON parse; if empty or invalid, return raw text
      try {
        return await response.json();
      } catch {
        return { message: 'No JSON body returned', status: response.status };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new BaseErrorResponseDto(
          `Request to n8n timed out after ${timeoutMs}ms`,
          'TIMEOUT',
          `TIMEOUT ERROR: The request took longer than ${timeoutMs}ms to complete.
          Possible causes:
            1. n8n instance is slow or overloaded
            2. Network connectivity issues
            3. Large data processing operation
            4. n8n instance is not responding
            Endpoint: ${path}
            Method: ${method}
            Suggestions:
            - Check n8n instance performance and logs
            - Verify network connectivity to ${this.baseUrl}
            - Consider increasing timeout for large operations
            - Check if n8n instance is running properly`
        );
      }

      // Handle network/connection errors
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET'
      ) {
        throw new BaseErrorResponseDto(
          'Cannot connect to n8n instance',
          'CONNECTION_ERROR',
          `CONNECTION FAILED: Unable to establish connection to n8n instance.
          Error details: ${error.message}
            Error code: ${error.code}
            Target URL: ${this.baseUrl}${path}

            Troubleshooting steps:
            1. Verify n8n instance is running and accessible
            2. Check the base URL configuration: ${this.baseUrl}
            3. Verify network connectivity
            4. Check firewall settings
            5. Confirm n8n API is enabled and accessible
            6. Try accessing ${this.baseUrl}/healthz in a browser`
        );
      }

      // Handle DNS resolution errors
      if (error.code === 'ENOTFOUND') {
        throw new BaseErrorResponseDto(
          'Cannot resolve n8n hostname',
          'DNS_ERROR',
          `DNS RESOLUTION FAILED: Cannot resolve hostname for n8n instance.
           Hostname: ${new URL(this.baseUrl).hostname}
            Full URL: ${this.baseUrl}

            Check:
            1. Hostname is correct in configuration
            2. DNS resolution is working
            3. n8n instance is accessible from this network
            4. Use IP address instead of hostname if DNS issues persist`
        );
      }

      console.log(`N8nService error on path ${path}:`, error);

      // Re-throw BaseErrorResponseDto instances
      if (error instanceof BaseErrorResponseDto) {
        throw error;
      }

      // Handle unknown errors with comprehensive context
      throw new BaseErrorResponseDto(
        `Failed to execute n8n request: ${error.message}`,
        500,
        `UNEXPECTED ERROR: An unexpected error occurred while calling n8n API.
          Error type: ${error.constructor.name}
          Error message: ${error.message}
          Endpoint: ${path}
          Method: ${method}
          Request context: ${JSON.stringify(
            {
              baseUrl: this.baseUrl,
              path,
              method,
              body: options.body,
              query: options.query,
              timeout: timeoutMs,
            },
            null,
            2
          )}
          Stack trace: ${error.stack ? error.stack.slice(0, 500) : 'Not available'}

          This suggests an application-level error. Check:
          1. Code logic and parameter validation
          2. n8n service configuration
          3. Application logs for more details`
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // --- User Management ---

  async getUsers(
    token: string,
    params: { limit?: number; cursor?: string; includeRole?: boolean; projectId?: string }
  ): Promise<any> {
    // Validate parameters with helpful error messages
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit) || params.limit < 1) {
        throw new BaseErrorResponseDto(
          'Invalid limit parameter',
          400,
          `VALIDATION ERROR: 'limit' must be a positive integer.
            Received: ${typeof params.limit} with value: ${JSON.stringify(params.limit)}

            Requirements:
            - Must be a positive integer (1, 2, 3, ...)
            - Used to limit the number of users returned
            - Example: { "limit": 10 } to get up to 10 users`
        );
      }
      if (params.limit > 1000) {
        throw new BaseErrorResponseDto(
          'Limit too large',
          400,
          `VALIDATION ERROR: 'limit' cannot exceed 1000 for performance reasons.
            Requested: ${params.limit}
            Maximum allowed: 1000

            Use pagination with cursor to retrieve more results:
            1. Set limit to 1000 or less
            2. Use the cursor from response to get next page`
        );
      }
    }

    if (
      params.cursor !== undefined &&
      (typeof params.cursor !== 'string' || params.cursor.trim().length === 0)
    ) {
      throw new BaseErrorResponseDto(
        'Invalid cursor parameter',
        400,
        `VALIDATION ERROR: 'cursor' must be a non-empty string.
          Received: ${typeof params.cursor} with value: ${JSON.stringify(params.cursor)}

          Cursor is used for pagination:
          - Use cursor value from previous getUsers response
          - Example: { "cursor": "next_page_token_123" }
          - Omit cursor for first page of results`
      );
    }

    if (params.includeRole !== undefined && typeof params.includeRole !== 'boolean') {
      throw new BaseErrorResponseDto(
        'Invalid includeRole parameter',
        400,
        `VALIDATION ERROR: 'includeRole' must be a boolean.
          Received: ${typeof params.includeRole} with value: ${JSON.stringify(params.includeRole)}

          Valid values:
          - true: include role information in response
          - false: exclude role information  
          - undefined: use default behavior`
      );
    }

    if (
      params.projectId !== undefined &&
      (typeof params.projectId !== 'string' || params.projectId.trim().length === 0)
    ) {
      throw new BaseErrorResponseDto(
        'Invalid projectId parameter',
        400,
        `VALIDATION ERROR: 'projectId' must be a non-empty string.
          Received: ${typeof params.projectId} with value: ${JSON.stringify(params.projectId)}

          ProjectId should be:
          - A valid project ID from your n8n instance
          - Get project IDs using getProjects() method
          - Example: { "projectId": "proj_123abc456def" }`
      );
    }

    return this._request(token, 'GET', '/users', { query: params });
  }

  async createUsers(
    token: string,
    params: { users: { email: string; role?: 'global:admin' | 'global:member' }[] }
  ): Promise<any> {
    // The API expects an array directly, not an object with a 'users' key.
    return this._request(token, 'POST', '/users', { body: params.users });
  }

  async getUser(token: string, params: { id: string; includeRole?: boolean }): Promise<any> {
    const { id, ...query } = params;
    return this._request(token, 'GET', `/users/${id}`, { query });
  }

  async deleteUser(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'DELETE', `/users/${params.id}`);
  }

  async changeRole(
    token: string,
    params: { id: string; newRoleName: 'global:admin' | 'global:member' }
  ): Promise<any> {
    const { id, ...body } = params;
    return this._request(token, 'PATCH', `/users/${id}/role`, { body });
  }

  // --- Project Management ---

  async getProjects(token: string, params: { limit?: number; cursor?: string }): Promise<any> {
    return this._request(token, 'GET', '/projects', { query: params });
  }

  async createProject(token: string, params: { name: string }): Promise<any> {
    return this._request(token, 'POST', '/projects', { body: params });
  }

  async deleteProject(token: string, params: { projectId: string }): Promise<any> {
    return this._request(token, 'DELETE', `/projects/${params.projectId}`);
  }

  async updateProject(token: string, params: { projectId: string; name: string }): Promise<any> {
    const { projectId, ...body } = params;
    return this._request(token, 'PUT', `/projects/${projectId}`, { body });
  }

  async addUsersToProject(
    token: string,
    params: { projectId: string; relations: { projectUserId: string; role: string }[] }
  ): Promise<any> {
    const { projectId, ...body } = params;
    // The API expects userId, so we need to map our safe name `projectUserId` back to `userId`.
    const apiRelations = body.relations.map((rel) => ({
      userId: rel.projectUserId,
      role: rel.role,
    }));
    return this._request(token, 'POST', `/projects/${projectId}/users`, {
      body: { relations: apiRelations },
    });
  }

  async deleteUserFromProject(
    token: string,
    params: { projectId: string; projectUserId: string }
  ): Promise<any> {
    return this._request(
      token,
      'DELETE',
      `/projects/${params.projectId}/users/${params.projectUserId}`
    );
  }

  async changeUserRoleInProject(
    token: string,
    params: { projectId: string; projectUserId: string; role: string }
  ): Promise<any> {
    const { projectId, projectUserId, ...body } = params;
    return this._request(token, 'PATCH', `/projects/${projectId}/users/${projectUserId}`, { body });
  }

  // --- Workflow Management ---

  async getWorkflows(
    token: string,
    params: {
      active?: boolean;
      tags?: string;
      name?: string;
      projectId?: string;
      excludePinnedData?: boolean;
      limit?: number;
      cursor?: string;
    }
  ): Promise<any> {
    console.log(token);
    return this._request(token, 'GET', '/workflows', { query: params });
  }

  async createWorkflow(
    token: string,
    params: { name: string; nodes: any[]; connections: object; settings: object }
  ): Promise<any> {
    // Enhanced parameter validation
    if (!params.name || typeof params.name !== 'string' || params.name.trim().length === 0) {
      throw new BaseErrorResponseDto(
        'Invalid workflow name',
        400,
        `VALIDATION ERROR: Workflow name is required and must be a non-empty string.
          Received: ${JSON.stringify(params.name)}

          Requirements:
          1. Must be a string
          2. Cannot be empty or whitespace only
          3. Should be descriptive and unique
          Example: { "name": "My Data Processing Workflow" }`
      );
    }

    if (!Array.isArray(params.nodes)) {
      throw new BaseErrorResponseDto(
        'Invalid nodes parameter',
        400,
        `VALIDATION ERROR: Nodes must be an array.
        Received: ${typeof params.nodes}
        Value: ${JSON.stringify(params.nodes)}

        Nodes array should contain workflow node definitions:
        - Each node represents a step in the workflow
        - At minimum, include a start trigger node
        - Example: [{ "name": "Start", "type": "n8n-nodes-base.start", ... }]`
      );
    }

    if (params.nodes.length === 0) {
      throw new BaseErrorResponseDto(
        'Empty nodes array',
        400,
        `VALIDATION ERROR: Workflow must contain at least one node.
          A workflow needs at least a trigger node to function.

          Add a trigger node such as:
          - Manual trigger: "n8n-nodes-base.manualTrigger"
          - Webhook trigger: "n8n-nodes-base.webhook"
          - Schedule trigger: "n8n-nodes-base.scheduleTrigger"`
      );
    }

    if (!params.connections || typeof params.connections !== 'object') {
      throw new BaseErrorResponseDto(
        'Invalid connections parameter',
        400,
        `VALIDATION ERROR: Connections must be an object.
          Received: ${typeof params.connections}
          Value: ${JSON.stringify(params.connections)}

          Connections define how nodes are linked together.
          Example: { "Node1": { "main": [{ "node": "Node2", "type": "main", "index": 0 }] } }`
      );
    }

    if (!params.settings || typeof params.settings !== 'object') {
      throw new BaseErrorResponseDto(
        'Invalid settings parameter',
        400,
        `VALIDATION ERROR: Settings must be an object.
          Received: ${typeof params.settings}
          Value: ${JSON.stringify(params.settings)}

          Settings contain workflow configuration.
          Example: { "executionOrder": "v1", "saveManualExecutions": true }`
      );
    }

    return this._request(token, 'POST', '/workflows', { body: params });
  }

  async getWorkflow(
    token: string,
    params: { id: string; excludePinnedData?: boolean }
  ): Promise<any> {
    const { id, excludePinnedData } = params as any;

    // Enhanced parameter validation with detailed error messages
    if (!id) {
      throw new BaseErrorResponseDto(
        'Missing required parameter: id',
        400,
        `PARAMETER ERROR: The 'id' parameter is required to fetch a workflow.
          Expected: { id: "workflow-id-string", excludePinnedData?: boolean }
          Received: ${JSON.stringify(params, null, 2)}

          To fix this:
          1. Provide a valid workflow ID (usually a UUID or string)
          2. Get workflow IDs from getWorkflows() method first
          3. Example: { "id": "12345abc-def6-7890-ghij-klmnopqrstuv" }`
      );
    }

    if (typeof id !== 'string') {
      throw new BaseErrorResponseDto(
        'Invalid parameter type: id must be a string',
        400,
        `TYPE ERROR: The 'id' parameter must be a string.
          Expected: string (workflow ID)
          Received: ${typeof id} with value: ${JSON.stringify(id)}

          Workflow IDs are typically:
          - UUID format: "12345abc-def6-7890-ghij-klmnopqrstuv"
          - String identifiers from n8n
          - Use getWorkflows() to see available workflow IDs`
      );
    }

    if (id.trim().length === 0) {
      throw new BaseErrorResponseDto(
        'Invalid parameter: id cannot be empty',
        400,
        `VALIDATION ERROR: The 'id' parameter cannot be empty or whitespace only.
          Received: "${id}"

          Provide a valid workflow ID:
          1. Check existing workflows with getWorkflows()
          2. Use the 'id' field from the workflow list
          3. Ensure the workflow exists in your n8n instance`
      );
    }

    const query: Record<string, any> = {};
    if (excludePinnedData !== undefined) {
      if (typeof excludePinnedData !== 'boolean') {
        throw new BaseErrorResponseDto(
          'Invalid parameter type: excludePinnedData must be boolean',
          400,
          `TYPE ERROR: The 'excludePinnedData' parameter must be a boolean.
            Expected: true or false
            Received: ${typeof excludePinnedData} with value: ${JSON.stringify(excludePinnedData)}

            Usage:
            - excludePinnedData: true  (exclude pinned data from response)
            - excludePinnedData: false (include pinned data in response)
            - omit parameter to use default behavior`
        );
      }
      query.excludePinnedData = excludePinnedData;
    }

    return this._request(token, 'GET', `/workflows/${id}`, { query });
  }

  async deleteWorkflow(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'DELETE', `/workflows/${params.id}`);
  }

  async updateWorkflow(
    token: string,
    params: { id: string; name: string; nodes: any[]; connections: object; settings: object }
  ): Promise<any> {
    const { id, ...body } = params;
    return this._request(token, 'PUT', `/workflows/${id}`, { body });
  }

  async activateWorkflow(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'POST', `/workflows/${params.id}/activate`);
  }

  async deactivateWorkflow(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'POST', `/workflows/${params.id}/deactivate`);
  }

  // --- Execution Monitoring ---

  async getExecutions(
    token: string,
    params: {
      includeData?: boolean;
      status?: 'error' | 'success' | 'waiting';
      workflowId?: string;
      projectId?: string;
      limit?: number;
      cursor?: string;
    }
  ): Promise<any> {
    return this._request(token, 'GET', '/executions', { query: params });
  }

  async getExecution(token: string, params: { id: number; includeData?: boolean }): Promise<any> {
    const { id, ...query } = params;
    return this._request(token, 'GET', `/executions/${id}`, { query });
  }

  async deleteExecution(token: string, params: { id: number }): Promise<any> {
    return this._request(token, 'DELETE', `/executions/${params.id}`);
  }

  // --- Credentials Management ---

  async createCredential(
    token: string,
    params: { name: string; type: string; data: object }
  ): Promise<any> {
    return this._request(token, 'POST', '/credentials', { body: params });
  }

  async deleteCredential(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'DELETE', `/credentials/${params.id}`);
  }

  async getCredentialType(token: string, params: { credentialTypeName: string }): Promise<any> {
    return this._request(token, 'GET', `/credentials/schema/${params.credentialTypeName}`);
  }

  // --- Tags Management ---

  async createTag(token: string, params: { name: string }): Promise<any> {
    return this._request(token, 'POST', '/tags', { body: params });
  }

  async getTags(token: string, params: { limit?: number; cursor?: string }): Promise<any> {
    return this._request(token, 'GET', '/tags', { query: params });
  }

  async getTag(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'GET', `/tags/${params.id}`);
  }

  async deleteTag(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'DELETE', `/tags/${params.id}`);
  }

  async updateTag(token: string, params: { id: string; name: string }): Promise<any> {
    const { id, ...body } = params;
    return this._request(token, 'PUT', `/tags/${id}`, { body });
  }

  // --- Instance Management ---

  async generateAudit(token: string, params: { additionalOptions?: object }): Promise<any> {
    return this._request(token, 'POST', '/audit', { body: params });
  }

  // --- Other tools from spec not covered above ---

  async transferWorkflow(
    token: string,
    params: { id: string; destinationProjectId: string }
  ): Promise<any> {
    const { id, ...body } = params;
    return this._request(token, 'PUT', `/workflows/${id}/transfer`, { body });
  }

  async transferCredential(
    token: string,
    params: { id: string; destinationProjectId: string }
  ): Promise<any> {
    const { id, ...body } = params;
    return this._request(token, 'PUT', `/credentials/${id}/transfer`, { body });
  }

  async getWorkflowTags(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'GET', `/workflows/${params.id}/tags`);
  }

  async updateWorkflowTags(
    token: string,
    params: { id: string; tags: { id: string }[] }
  ): Promise<any> {
    const { id, ...body } = params;
    return this._request(token, 'PUT', `/workflows/${id}/tags`, { body });
  }

  async pull(token: string, params: { force?: boolean; variables?: object }): Promise<any> {
    return this._request(token, 'POST', '/source-control/pull', { body: params });
  }

  async createVariable(token: string, params: { key: string; value: string }): Promise<any> {
    return this._request(token, 'POST', '/variables', { body: params });
  }

  async getVariables(token: string, params: { limit?: number; cursor?: string }): Promise<any> {
    return this._request(token, 'GET', '/variables', { query: params });
  }

  async deleteVariable(token: string, params: { id: string }): Promise<any> {
    return this._request(token, 'DELETE', `/variables/${params.id}`);
  }

  async updateVariable(
    token: string,
    params: { id: string; key: string; value: string }
  ): Promise<any> {
    const { id, ...body } = params;
    return this._request(token, 'PUT', `/variables/${id}`, { body });
  }
}
