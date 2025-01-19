import { Request, Response } from 'express';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private formatMessage(name: string, data: any): string {
    return Object.keys(data).length ? ` \n ${name}: ${JSON.stringify(data, null, 2)}` : '';
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const { method, url, body, params, query } = request;

    const paramMessage = this.formatMessage('params', params);
    const queryMessage = this.formatMessage('query', query);
    const bodyMessage = this.formatMessage('body', body);

    let errorMessage: any = exception.getResponse();
    if (typeof errorMessage === 'object' && 'message' in errorMessage) {
      errorMessage = errorMessage.message;
    }

    this.logger.error(
      `Error in ${method} ${url}${paramMessage}${queryMessage}${bodyMessage}\n statusCode: ${status}\n message: ${JSON.stringify(errorMessage, null, 2)}`,
    );

    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      path: url,
      timestamp: new Date().toISOString(),
    });
  }
}
