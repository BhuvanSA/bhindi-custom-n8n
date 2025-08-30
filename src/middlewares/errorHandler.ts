import { Request, Response, NextFunction } from 'express';
import { BaseErrorResponseDto } from '@/types/agent.js';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  err: CustomError | BaseErrorResponseDto,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('Error caught by middleware:', err);

  // Handle BaseErrorResponseDto with detailed error information
  if (err instanceof BaseErrorResponseDto) {
    const statusCode = typeof err.error.code === 'number' ? err.error.code : 500;
    res.status(statusCode).json(err);
    return;
  }

  // Handle traditional Express errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Create a BaseErrorResponseDto for consistency
  const errorResponse = new BaseErrorResponseDto(
    message,
    statusCode,
    process.env.NODE_ENV === 'development' && err.stack
      ? `Stack trace: ${err.stack.slice(0, 500)}`
      : 'Error details not available in production'
  );

  res.status(statusCode).json(errorResponse);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const errorResponse = new BaseErrorResponseDto(
    `Not Found - ${req.originalUrl}`,
    404,
    `ENDPOINT NOT FOUND: The requested endpoint does not exist.
Requested: ${req.method} ${req.originalUrl}

Available endpoints:
- POST /tools/:toolName - Execute a tool
- GET /tools - List available tools

Check:
1. URL spelling and format
2. HTTP method (GET, POST, etc.)
3. Tool name if using /tools/:toolName`
  );
  res.status(404).json(errorResponse);
};
