import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Guard } from 'src/interfaces/guard.interface';

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request?.user;

    return user as Guard.UserResponse;
  },
);
