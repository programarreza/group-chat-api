import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      if (typeof res === 'object' && res.code) {
        code = res.code;
        message = res.message || message;
      } else if (typeof res === 'object' && res.message) {
        // Handle class-validator BadRequestExceptions
        if (status === HttpStatus.BAD_REQUEST && Array.isArray(res.message)) {
          code = 'VALIDATION_ERROR';
          message = res.message[0];
        } else {
          message = typeof res.message === 'string' ? res.message : JSON.stringify(res.message);
          code = this.getDefaultCodeForStatus(status);
        }
      } else {
        message = exception.message;
        code = this.getDefaultCodeForStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }

  private getDefaultCodeForStatus(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      default: return 'ERROR';
    }
  }
}
