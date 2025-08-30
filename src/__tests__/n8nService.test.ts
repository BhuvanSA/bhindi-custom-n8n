import { N8nService } from '@/services/n8nService.js';
import { BaseErrorResponseDto } from '@/types/agent.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('N8nService', () => {
  let n8nService: N8nService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    n8nService = new N8nService();
    mockFetch.mockClear();
    jest.useRealTimers();
  });

  describe('getUsers', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'global:admin',
      },
      {
        id: '2',
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'global:member',
      },
    ];

    it('should retrieve users with default parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: mockUsers }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await n8nService.getUsers('valid-token', {});

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5678/api/v1/users', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Bhindi-Agent-Starter/1.0',
          'X-N8N-API-KEY': 'valid-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result.data).toEqual(mockUsers);
    });

    it('should handle custom parameters correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: [mockUsers[0]] }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const params = {
        limit: 10,
        includeRole: true,
        projectId: 'project-123',
      };

      await n8nService.getUsers('valid-token', params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5678/api/v1/users?limit=10&includeRole=true&projectId=project-123',
        expect.any(Object)
      );
    });

    it('should validate limit parameter', async () => {
      await expect(n8nService.getUsers('valid-token', { limit: -1 })).rejects.toBeInstanceOf(
        BaseErrorResponseDto
      );

      await expect(n8nService.getUsers('valid-token', { limit: 1001 })).rejects.toBeInstanceOf(
        BaseErrorResponseDto
      );

      await expect(n8nService.getUsers('valid-token', { limit: 3.5 })).rejects.toBeInstanceOf(
        BaseErrorResponseDto
      );
    });

    it('should validate cursor parameter', async () => {
      await expect(n8nService.getUsers('valid-token', { cursor: '' })).rejects.toBeInstanceOf(
        BaseErrorResponseDto
      );

      await expect(
        n8nService.getUsers('valid-token', { cursor: 123 as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });

    it('should validate includeRole parameter', async () => {
      await expect(
        n8nService.getUsers('valid-token', { includeRole: 'true' as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });

    it('should validate projectId parameter', async () => {
      await expect(n8nService.getUsers('valid-token', { projectId: '' })).rejects.toBeInstanceOf(
        BaseErrorResponseDto
      );

      await expect(
        n8nService.getUsers('valid-token', { projectId: 123 as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });
  });

  describe('createUsers', () => {
    it('should create users successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const users = [{ email: 'newuser@example.com', role: 'global:member' as const }];

      await n8nService.createUsers('valid-token', { users });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5678/api/v1/users', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Bhindi-Agent-Starter/1.0',
          'X-N8N-API-KEY': 'valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(users),
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('getWorkflows', () => {
    const mockWorkflows = [
      {
        id: 'workflow-1',
        name: 'Test Workflow 1',
        active: true,
        nodes: [],
        connections: {},
        settings: {},
      },
      {
        id: 'workflow-2',
        name: 'Test Workflow 2',
        active: false,
        nodes: [],
        connections: {},
        settings: {},
      },
    ];

    it('should retrieve workflows with parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: mockWorkflows }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const params = {
        active: true,
        limit: 10,
        projectId: 'project-123',
      };

      const result = await n8nService.getWorkflows('valid-token', params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5678/api/v1/workflows?active=true&limit=10&projectId=project-123',
        expect.any(Object)
      );

      expect(result.data).toEqual(mockWorkflows);
    });
  });

  describe('getWorkflow', () => {
    const mockWorkflow = {
      id: 'workflow-123',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'start',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          position: [100, 100],
          parameters: {},
        },
      ],
      connections: {},
      settings: {},
    };

    it('should retrieve specific workflow by ID', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflow),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await n8nService.getWorkflow('valid-token', {
        id: 'workflow-123',
        excludePinnedData: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5678/api/v1/workflows/workflow-123?excludePinnedData=true',
        expect.any(Object)
      );

      expect(result).toEqual(mockWorkflow);
    });

    it('should validate required id parameter', async () => {
      await expect(n8nService.getWorkflow('valid-token', { id: '' })).rejects.toBeInstanceOf(
        BaseErrorResponseDto
      );

      await expect(n8nService.getWorkflow('valid-token', { id: '   ' })).rejects.toBeInstanceOf(
        BaseErrorResponseDto
      );

      await expect(
        n8nService.getWorkflow('valid-token', { id: null as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);

      await expect(
        n8nService.getWorkflow('valid-token', { id: undefined as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });

    it('should validate id parameter type', async () => {
      await expect(
        n8nService.getWorkflow('valid-token', { id: 123 as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });

    it('should validate excludePinnedData parameter type', async () => {
      await expect(
        n8nService.getWorkflow('valid-token', {
          id: 'workflow-123',
          excludePinnedData: 'true' as any,
        })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });
  });

  describe('createWorkflow', () => {
    const validWorkflowData = {
      name: 'Test Workflow',
      nodes: [
        {
          id: 'start',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          position: [100, 100],
          parameters: {},
        },
      ],
      connections: {},
      settings: { executionOrder: 'v1' },
    };

    it('should create workflow successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 'new-workflow-id', ...validWorkflowData }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await n8nService.createWorkflow('valid-token', validWorkflowData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5678/api/v1/workflows', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Bhindi-Agent-Starter/1.0',
          'X-N8N-API-KEY': 'valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validWorkflowData),
        signal: expect.any(AbortSignal),
      });

      expect(result.id).toBe('new-workflow-id');
    });

    it('should validate workflow name', async () => {
      await expect(
        n8nService.createWorkflow('valid-token', { ...validWorkflowData, name: '' })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);

      await expect(
        n8nService.createWorkflow('valid-token', { ...validWorkflowData, name: '   ' })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);

      await expect(
        n8nService.createWorkflow('valid-token', { ...validWorkflowData, name: null as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });

    it('should validate nodes parameter', async () => {
      await expect(
        n8nService.createWorkflow('valid-token', { ...validWorkflowData, nodes: 'invalid' as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);

      await expect(
        n8nService.createWorkflow('valid-token', { ...validWorkflowData, nodes: [] })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });

    it('should validate connections parameter', async () => {
      await expect(
        n8nService.createWorkflow('valid-token', {
          ...validWorkflowData,
          connections: 'invalid' as any,
        })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);

      await expect(
        n8nService.createWorkflow('valid-token', { ...validWorkflowData, connections: null as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });

    it('should validate settings parameter', async () => {
      await expect(
        n8nService.createWorkflow('valid-token', {
          ...validWorkflowData,
          settings: 'invalid' as any,
        })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);

      await expect(
        n8nService.createWorkflow('valid-token', { ...validWorkflowData, settings: null as any })
      ).rejects.toBeInstanceOf(BaseErrorResponseDto);
    });
  });

  describe('getExecutions', () => {
    const mockExecutions = [
      {
        id: 1,
        workflowId: 'workflow-1',
        mode: 'manual',
        status: 'success',
        startedAt: '2023-01-01T00:00:00Z',
        stoppedAt: '2023-01-01T00:05:00Z',
      },
      {
        id: 2,
        workflowId: 'workflow-2',
        mode: 'trigger',
        status: 'error',
        startedAt: '2023-01-01T01:00:00Z',
        stoppedAt: '2023-01-01T01:02:00Z',
      },
    ];

    it('should retrieve executions with filters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: mockExecutions }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const params = {
        status: 'success' as const,
        limit: 10,
        includeData: false,
      };

      const result = await n8nService.getExecutions('valid-token', params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5678/api/v1/executions?status=success&limit=10&includeData=false',
        expect.any(Object)
      );

      expect(result.data).toEqual(mockExecutions);
    });
  });

  describe('error handling', () => {
    it('should handle 401 authentication errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Map([['content-type', 'application/json']]),
        text: jest.fn().mockResolvedValue('{"message": "Invalid API key"}'),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(n8nService.getUsers('invalid-token', {})).rejects.toMatchObject({
        error: {
          code: 401,
          message: 'Authentication failed with n8n API',
        },
      });
    });

    it('should handle 403 permission errors', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Map([['content-type', 'application/json']]),
        text: jest.fn().mockResolvedValue('{"message": "Insufficient permissions"}'),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(n8nService.getUsers('valid-token', {})).rejects.toMatchObject({
        error: {
          code: 403,
          message: 'Permission denied or rate limit exceeded',
        },
      });
    });

    it('should handle 404 not found errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        text: jest.fn().mockResolvedValue('{"message": "Resource not found"}'),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(
        n8nService.getWorkflow('valid-token', { id: 'non-existent' })
      ).rejects.toMatchObject({
        error: {
          code: 404,
          message: 'Resource not found',
        },
      });
    });

    it('should handle 400 validation errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map([['content-type', 'application/json']]),
        text: jest
          .fn()
          .mockResolvedValue('{"message": "Validation failed", "errors": ["Invalid parameter"]}'),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(n8nService.getUsers('valid-token', {})).rejects.toMatchObject({
        error: {
          code: 400,
          message: 'Invalid request parameters',
        },
      });
    });

    it('should handle timeout errors', async () => {
      jest.useFakeTimers();

      mockFetch.mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            setTimeout(() => {
              const err = new Error('The operation was aborted');
              (err as any).name = 'AbortError';
              reject(err);
            }, 100);
          })
      );

      const promise = n8nService.getUsers('valid-token', {});

      jest.advanceTimersByTime(15000); // Advance past the 10s timeout

      await expect(promise).rejects.toMatchObject({
        error: {
          code: 'TIMEOUT',
        },
      });

      jest.useRealTimers();
    });

    it('should handle network connection errors', async () => {
      const networkError = new Error('Failed to fetch');
      (networkError as any).code = 'ECONNREFUSED';
      mockFetch.mockRejectedValue(networkError);

      await expect(n8nService.getUsers('valid-token', {})).rejects.toMatchObject({
        error: {
          code: 'CONNECTION_ERROR',
        },
      });
    });

    it('should handle 204 No Content responses', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        statusText: 'No Content',
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await n8nService.deleteUser('valid-token', { id: 'user-123' });

      expect(result).toEqual({
        success: true,
        message: 'Operation successful.',
      });
    });
  });

  describe('parameter filtering', () => {
    it('should strip out undefined and null parameters from query', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await n8nService.getUsers('valid-token', {
        limit: 10,
        cursor: undefined,
        projectId: 'project-123',
      });

      const call = mockFetch.mock.calls[0];
      const url = call[0] as string;

      expect(url).toContain('limit=10');
      expect(url).toContain('projectId=project-123');
      expect(url).not.toContain('cursor=');
    });

    it('should handle parameters with undefined values correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      // Test with some undefined parameters that should be filtered out
      await n8nService.getWorkflows('valid-token', {
        active: true,
        tags: undefined,
        name: undefined,
        limit: 5,
      });

      const call = mockFetch.mock.calls[0];
      const url = call[0] as string;

      expect(url).toContain('active=true');
      expect(url).toContain('limit=5');
      expect(url).not.toContain('tags=');
      expect(url).not.toContain('name=');
    });
  });

  describe('credential management', () => {
    it('should create credential successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 'cred-123', name: 'Test Credential' }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const credentialData = {
        name: 'Test Credential',
        type: 'github',
        data: { accessToken: 'token123' },
      };

      const result = await n8nService.createCredential('valid-token', credentialData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5678/api/v1/credentials', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Bhindi-Agent-Starter/1.0',
          'X-N8N-API-KEY': 'valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialData),
        signal: expect.any(AbortSignal),
      });

      expect(result.id).toBe('cred-123');
    });

    it('should get credential type schema', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          type: 'github',
          properties: { accessToken: { type: 'string' } },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await n8nService.getCredentialType('valid-token', {
        credentialTypeName: 'github',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5678/api/v1/credentials/schema/github',
        expect.any(Object)
      );

      expect(result.type).toBe('github');
    });
  });

  describe('tag management', () => {
    it('should create tag successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 'tag-123', name: 'Test Tag' }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await n8nService.createTag('valid-token', { name: 'Test Tag' });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5678/api/v1/tags', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Bhindi-Agent-Starter/1.0',
          'X-N8N-API-KEY': 'valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test Tag' }),
        signal: expect.any(AbortSignal),
      });

      expect(result.id).toBe('tag-123');
    });

    it('should update workflow tags', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const tagData = {
        id: 'workflow-123',
        tags: [{ id: 'tag-1' }, { id: 'tag-2' }],
      };

      await n8nService.updateWorkflowTags('valid-token', tagData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5678/api/v1/workflows/workflow-123/tags',
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Bhindi-Agent-Starter/1.0',
            'X-N8N-API-KEY': 'valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags: tagData.tags }),
          signal: expect.any(AbortSignal),
        }
      );
    });
  });
});
