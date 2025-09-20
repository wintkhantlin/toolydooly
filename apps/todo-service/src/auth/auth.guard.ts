import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const url = process.env.AUTH_SERVICE ?? "http://localhost:3002";

    const AUTH_SERVICE_GET_SESSION = url + '/session';

    const response = await fetch(AUTH_SERVICE_GET_SESSION, {
      method: 'GET',
      headers: {
        Authorization: authorization as string,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const sessionData = await response.json();
    
    (request as any).user = sessionData;

    return true;
  }
}
