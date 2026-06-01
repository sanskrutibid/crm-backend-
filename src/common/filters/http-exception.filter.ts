import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const resContent = exception.getResponse() as any;
      if (typeof resContent === 'object' && resContent !== null) {
        message = resContent.message || exception.message;
        error = resContent.error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception?.name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ID format: "${exception.value}" at path "${exception.path}"`;
      error = 'Bad Request';
    } else if (exception?.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = Object.values(exception.errors || {}).map(
        (err: any) => err.message,
      );
      error = 'Bad Request';
    } else {
      this.logger.error(
        `Unhandled Exception: ${exception.message || exception}`,
        exception.stack,
      );
      message = exception.message || 'An unexpected error occurred';
    }

    const payload = {
      success: false,
      statusCode: status,
      message: typeof message === 'string' ? [message] : message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url ?? request.raw?.url ?? '',
    };

    // Support both Fastify (reply.status().send()) and Express (res.status().json())
    if (typeof response.send === 'function') {
      response.status(status).send(payload);
    } else {
      response.status(status).json(payload);
    }
  }
}
