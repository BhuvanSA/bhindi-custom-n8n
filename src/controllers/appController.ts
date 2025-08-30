import { Request, Response } from 'express';
import { CalculatorService } from '../services/calculatorService.js';
import { GitHubService } from '../services/githubService.js';
import { BaseSuccessResponseDto, BaseErrorResponseDto } from '../types/agent.js';
import { N8nService } from '@/services/n8nService.js';

/**
 * App Controller
 * Handles both calculator tools (public, no auth) and GitHub tools (authenticated)
 * Demonstrates mixed authentication patterns for educational purposes
 */
export class AppController {
  private calculatorService: CalculatorService;
  private githubService: GitHubService;
  private n8nService: N8nService;

  constructor() {
    this.calculatorService = new CalculatorService();
    this.githubService = new GitHubService();
    this.n8nService = new N8nService();
  }

  /**
   * Handle tool execution - routes to appropriate handler based on tool type
   */
  async handleTool(req: Request, res: Response): Promise<void> {
    const { toolName } = req.params;
    const params = req.body;

    try {
      // Handle Calculator Tools (No Auth Required)
      if (this.isCalculatorTool(toolName)) {
        await this.handleCalculatorTool(toolName, params, res);
        return;
      }

      // Handle GitHub Tools (Auth Required)
      if (this.isGitHubTool(toolName)) {
        const token = this.extractBearerToken(req);
        if (!token) {
          const errorResponse = new BaseErrorResponseDto(
            'GitHub tools require authentication. Please provide a Bearer token.',
            401,
            'Missing Authorization header with Bearer token'
          );
          res.status(401).json(errorResponse);
          return;
        }
        await this.handleGitHubTool(toolName, params, token, res);
        return;
      }

      // Handle n8n Tools (Auth Required) - prefer X-API-Key header, fallback to Bearer
      if (this.isN8nTool(toolName)) {
        let token: string;
        token = this.extractApikeys(req);

        // Clean params by removing internal tracking fields that shouldn't be passed to n8n API
        const cleanParams = this.cleanN8nParams(params);

        await this.handleN8nTool(toolName, cleanParams, token, res);
        return;
      }

      // Unknown tool
      const errorResponse = new BaseErrorResponseDto(
        `Unknown tool: ${toolName}`,
        404,
        `Available tools: ${[...this.getCalculatorTools(), ...this.getGitHubTools(), ...this.getN8nTools()].join(', ')}`
      );
      res.status(404).json(errorResponse);
    } catch (error) {
      const errorResponse = new BaseErrorResponseDto(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        'Tool execution failed'
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Handle calculator tool execution
   */
  private async handleCalculatorTool(toolName: string, params: any, res: Response): Promise<void> {
    let result: number;
    let operation: string;

    switch (toolName) {
      case 'add':
        this.validateParameters(params, ['a', 'b']);
        result = this.calculatorService.add(params.a, params.b);
        operation = `${params.a} + ${params.b}`;
        break;

      case 'subtract':
        this.validateParameters(params, ['a', 'b']);
        result = this.calculatorService.subtract(params.a, params.b);
        operation = `${params.a} - ${params.b}`;
        break;

      case 'multiply':
        this.validateParameters(params, ['a', 'b']);
        result = this.calculatorService.multiply(params.a, params.b);
        operation = `${params.a} × ${params.b}`;
        break;

      case 'divide':
        this.validateParameters(params, ['a', 'b']);
        result = this.calculatorService.divide(params.a, params.b);
        operation = `${params.a} ÷ ${params.b}`;
        break;

      case 'power':
        this.validateParameters(params, ['base', 'exponent']);
        result = this.calculatorService.power(params.base, params.exponent);
        operation = `${params.base}^${params.exponent}`;
        break;

      case 'sqrt':
        this.validateParameters(params, ['number']);
        result = this.calculatorService.sqrt(params.number);
        operation = `√${params.number}`;
        break;

      case 'percentage':
        this.validateParameters(params, ['percentage', 'of']);
        result = this.calculatorService.percentage(params.percentage, params.of);
        operation = `${params.percentage}% of ${params.of}`;
        break;

      case 'factorial':
        this.validateParameters(params, ['number']);
        result = this.calculatorService.factorial(params.number);
        operation = `${params.number}!`;
        break;

      case 'countCharacter':
        this.validateCharacterCountParameters(params);
        result = this.calculatorService.countCharacter(params.character, params.text);
        operation = `Count '${params.character}' in "${params.text.length > 30 ? params.text.substring(0, 30) + '...' : params.text}"`;
        break;

      default:
        throw new Error(`Unknown calculator tool: ${toolName}`);
    }

    const response = new BaseSuccessResponseDto(
      {
        operation,
        result,
        message: `Calculated ${operation} = ${result}`,
        tool_type: 'calculator',
      },
      'mixed'
    );

    res.json(response);
  }

  /**
   * Handle GitHub tool execution
   */
  private async handleGitHubTool(
    toolName: string,
    params: any,
    token: string,
    res: Response
  ): Promise<void> {
    switch (toolName) {
      case 'listUserRepositories':
        const repositories = await this.githubService.listUserRepositories(token, {
          per_page: params.per_page,
          sort: params.sort,
          direction: params.direction,
          type: params.type,
        });

        const response = new BaseSuccessResponseDto(
          {
            ...repositories,
            tool_type: 'github',
            authenticated: true,
          },
          'mixed'
        );

        res.json(response);
        break;

      default:
        throw new Error(`Unknown GitHub tool: ${toolName}`);
    }
  }
  // Helper function to create and send the response
  private createToolResponse(data: any, res: Response): void {
    const response = new BaseSuccessResponseDto(
      {
        ...data,
        tool_type: 'n8n',
        authenticated: true,
      },
      'mixed'
    );
    res.json(response);
  }

  private async handleN8nTool(
    toolName: string,
    params: any,
    token: string,
    res: Response
  ): Promise<void> {
    const baseName = toolName.replace(/^customn8n_/, '');
    let result; // To hold the result from the service call

    try {
      switch (baseName) {
        // --- User Management ---
        case 'getUsers':
          result = await this.n8nService.getUsers(token, params);
          break;
        case 'createUsers':
          result = await this.n8nService.createUsers(token, params);
          break;
        case 'getUser':
          result = await this.n8nService.getUser(token, params);
          break;
        case 'deleteUser':
          result = await this.n8nService.deleteUser(token, params);
          break;
        case 'changeRole':
          result = await this.n8nService.changeRole(token, params);
          break;

        // --- Project Management ---
        case 'getProjects':
          result = await this.n8nService.getProjects(token, params);
          break;
        case 'createProject':
          result = await this.n8nService.createProject(token, params);
          break;
        case 'deleteProject':
          result = await this.n8nService.deleteProject(token, params);
          break;
        case 'updateProject':
          result = await this.n8nService.updateProject(token, params);
          break;
        case 'addUsersToProject':
          result = await this.n8nService.addUsersToProject(token, params);
          break;
        case 'deleteUserFromProject':
          result = await this.n8nService.deleteUserFromProject(token, params);
          break;
        case 'changeUserRoleInProject':
          result = await this.n8nService.changeUserRoleInProject(token, params);
          break;

        // --- Workflow Management ---
        case 'getWorkflows':
          console.log('hit get workflows', token);
          result = await this.n8nService.getWorkflows(token, params);
          break;
        case 'createWorkflow':
          result = await this.n8nService.createWorkflow(token, params);
          break;
        case 'getWorkflow':
          result = await this.n8nService.getWorkflow(token, params);
          break;
        case 'deleteWorkflow':
          result = await this.n8nService.deleteWorkflow(token, params);
          break;
        case 'updateWorkflow':
          result = await this.n8nService.updateWorkflow(token, params);
          break;
        case 'activateWorkflow':
          result = await this.n8nService.activateWorkflow(token, params);
          break;
        case 'deactivateWorkflow':
          result = await this.n8nService.deactivateWorkflow(token, params);
          break;
        case 'transferWorkflow':
          result = await this.n8nService.transferWorkflow(token, params);
          break;
        case 'getWorkflowTags':
          result = await this.n8nService.getWorkflowTags(token, params);
          break;
        case 'updateWorkflowTags':
          result = await this.n8nService.updateWorkflowTags(token, params);
          break;

        // --- Execution Monitoring ---
        case 'getExecutions':
          result = await this.n8nService.getExecutions(token, params);
          break;
        case 'getExecution':
          result = await this.n8nService.getExecution(token, params);
          break;
        case 'deleteExecution':
          result = await this.n8nService.deleteExecution(token, params);
          break;

        // --- Credentials Management ---
        case 'createCredential':
          result = await this.n8nService.createCredential(token, params);
          break;
        case 'deleteCredential':
          result = await this.n8nService.deleteCredential(token, params);
          break;
        case 'transferCredential':
          result = await this.n8nService.transferCredential(token, params);
          break;
        case 'getCredentialType':
          result = await this.n8nService.getCredentialType(token, params);
          break;

        // --- Tags Management ---
        case 'createTag':
          result = await this.n8nService.createTag(token, params);
          break;
        case 'getTags':
          result = await this.n8nService.getTags(token, params);
          break;
        case 'getTag':
          result = await this.n8nService.getTag(token, params);
          break;
        case 'deleteTag':
          result = await this.n8nService.deleteTag(token, params);
          break;
        case 'updateTag':
          result = await this.n8nService.updateTag(token, params);
          break;

        // --- Instance Management & Other ---
        case 'generateAudit':
          result = await this.n8nService.generateAudit(token, params);
          break;
        case 'pull':
          result = await this.n8nService.pull(token, params);
          break;
        case 'createVariable':
          result = await this.n8nService.createVariable(token, params);
          break;
        case 'getVariables':
          result = await this.n8nService.getVariables(token, params);
          break;
        case 'deleteVariable':
          result = await this.n8nService.deleteVariable(token, params);
          break;
        case 'updateVariable':
          result = await this.n8nService.updateVariable(token, params);
          break;

        default:
          throw new BaseErrorResponseDto(
            `Unknown or unimplemented n8n tool: ${toolName}`,
            404,
            `TOOL NOT FOUND: The requested n8n tool is not implemented or doesn't exist.
Requested tool: ${toolName}
Base tool name: ${baseName}

Available n8n tools:
${this.getN8nTools()
  .map((tool) => `- ${tool}`)
  .join('\n')}

Check:
1. Tool name spelling and format
2. Use 'customn8n_' prefix for n8n tools
3. Refer to available tools list above`
          );
      }

      this.createToolResponse(result, res);
    } catch (error: any) {
      // Enhanced error handling - pass through detailed BaseErrorResponseDto
      if (error instanceof BaseErrorResponseDto) {
        res.status(typeof error.error.code === 'number' ? error.error.code : 500).json(error);
        return;
      }

      // Handle unexpected errors with context
      const errorResponse = new BaseErrorResponseDto(
        `Unexpected error in n8n tool execution: ${error.message}`,
        500,
        `INTERNAL ERROR: An unexpected error occurred while executing n8n tool.
Tool: ${toolName}
Base name: ${baseName}
Parameters: ${JSON.stringify(params, null, 2)}
Error type: ${error.constructor.name}
Error message: ${error.message}
Stack trace: ${error.stack ? error.stack.slice(0, 500) : 'Not available'}

This indicates a programming error or unexpected condition.
Check application logs and contact support if the issue persists.`
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Validate required parameters
   */
  private validateParameters(params: any, required: string[]): void {
    for (const param of required) {
      if (params[param] === undefined || params[param] === null) {
        throw new Error(`Missing required parameter: ${param}`);
      }
      if (typeof params[param] !== 'number') {
        throw new Error(`Parameter '${param}' must be a number`);
      }
    }
  }

  /**
   * Validate parameters for character count tool
   */
  private validateCharacterCountParameters(params: any): void {
    if (params.character === undefined || params.character === null) {
      throw new Error('Missing required parameter: character');
    }
    if (params.text === undefined || params.text === null) {
      throw new Error('Missing required parameter: text');
    }
    if (typeof params.character !== 'string') {
      throw new Error("Parameter 'character' must be a string");
    }
    if (typeof params.text !== 'string') {
      throw new Error("Parameter 'text' must be a string");
    }
    if (params.character.length !== 1) {
      throw new Error('Character parameter must be exactly one character');
    }
  }

  private extractApikeys(req: Request): string {
    console.log('headers', req.headers);
    const apiKeys = req.headers['x-apikey'] || req.headers['x-api-key'];
    console.log(apiKeys);
    if (Array.isArray(apiKeys)) {
      if (apiKeys.length === 0) {
        throw new BaseErrorResponseDto(
          'Empty API key array provided',
          401,
          `AUTHENTICATION ERROR: API key header contains an empty array.
            Header found: x-api-key or x-apikey
            Value: ${JSON.stringify(apiKeys)}

            To fix:
            1. Provide a single API key value in the header
            2. Remove empty array values
            3. Example: x-apikey: your-actual-api-key-here`
        );
      }
      return apiKeys[0];
    }
    if (apiKeys) {
      if (typeof apiKeys !== 'string' || apiKeys.trim().length === 0) {
        throw new BaseErrorResponseDto(
          'Invalid API key format',
          401,
          `AUTHENTICATION ERROR: API key must be a non-empty string.
            Header: x-apikey
            Received type: ${typeof apiKeys}
            Value: ${JSON.stringify(apiKeys)}

            Requirements:
            1. API key must be a string
            2. Cannot be empty or whitespace only
            3. Should be your n8n API key from n8n settings`
        );
      }
      return apiKeys;
    }

    // Check for Bearer token as fallback
    const bearerToken = this.extractBearerToken(req);
    if (bearerToken) {
      return bearerToken;
    }

    throw new BaseErrorResponseDto(
      'n8n API key required',
      401,
      `AUTHENTICATION ERROR: No API key found for n8n tools.
        n8n tools require authentication via API key.

        Provide API key using one of these methods:
        1. Header: x-api-key: your-n8n-api-key
        2. Header: x-apikey: your-n8n-api-key  
        3. Header: Authorization: Bearer your-n8n-api-key

        To get your n8n API key:
        1. Open n8n instance
        2. Go to Settings > API Keys
        3. Create or copy existing API key
        4. Use it in the request header

Current headers: ${JSON.stringify(Object.keys(req.headers), null, 2)}`
    );
  }

  /**
   * Extract Bearer token from request
   */
  private extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    console.log(req.headers);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * Check if tool is a calculator tool
   */
  private isCalculatorTool(toolName: string): boolean {
    return this.getCalculatorTools().includes(toolName);
  }

  /**
   * Check if tool is a GitHub tool
   */
  private isGitHubTool(toolName: string): boolean {
    return this.getGitHubTools().includes(toolName);
  }

  private isN8nTool(toolName: string): boolean {
    if (!toolName.startsWith('customn8n_')) return false;
    const base = toolName.replace(/^customn8n_/, '');
    return this.getN8nTools().some((t) => t.endsWith(base));
  }

  /**
   * Get list of calculator tools
   */
  private getCalculatorTools(): string[] {
    return [
      'add',
      'subtract',
      'multiply',
      'divide',
      'power',
      'sqrt',
      'percentage',
      'factorial',
      'countCharacter',
    ];
  }

  /**
   * Get list of GitHub tools
   */
  private getGitHubTools(): string[] {
    return ['listUserRepositories'];
  }

  /**
   * Get list of n8n tools
   */
  private getN8nTools(): string[] {
    const baseTools = [
      'getUsers',
      'createUsers',
      'getUser',
      'deleteUser',
      'changeRole',
      'getProjects',
      'createProject',
      'deleteProject',
      'updateProject',
      'addUsersToProject',
      'deleteUserFromProject',
      'changeUserRoleInProject',
      'getWorkflows',
      'createWorkflow',
      'getWorkflow',
      'deleteWorkflow',
      'updateWorkflow',
      'activateWorkflow',
      'deactivateWorkflow',
      'transferWorkflow',
      'getWorkflowTags',
      'updateWorkflowTags',
      'getExecutions',
      'getExecution',
      'deleteExecution',
      'createCredential',
      'deleteCredential',
      'transferCredential',
      'getCredentialType',
      'createTag',
      'getTags',
      'getTag',
      'deleteTag',
      'updateTag',
      'generateAudit',
      'pull',
      'createVariable',
      'getVariables',
      'deleteVariable',
      'updateVariable',
    ];
    return baseTools.map((t) => `customn8n_${t}`);
  }

  /**
   * Clean parameters by removing internal tracking fields that shouldn't be passed to n8n API
   */
  private cleanN8nParams(params: any): any {
    if (!params || typeof params !== 'object') {
      return params;
    }

    // List of internal parameters that should not be passed to n8n API
    const internalParams = [
      'toolName',
      'userId',
      'executionId',
      'chatId',
      'sessionId',
      'requestId',
      'timestamp',
      'source',
      'context',
    ];

    // Create a clean copy without internal parameters
    const cleanParams = { ...params };
    internalParams.forEach((param) => {
      delete cleanParams[param];
    });

    return cleanParams;
  }
}
