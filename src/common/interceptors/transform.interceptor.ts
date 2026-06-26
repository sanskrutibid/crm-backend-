import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    // If response is already sent (e.g. manual file download), bypass mapping to avoid invalid payload type errors
    if (response.sent || response.headersSent || response.raw?.headersSent) {
      return next.handle();
    }

    // Support both Fastify (reply.statusCode) and Express (res.statusCode)
    const statusCode = response.statusCode ?? response.raw?.statusCode ?? 200;

    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ||
      'Operation successful';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        message,
        data: data !== undefined && data !== null ? data : null,
      })),
    );
  }
}
