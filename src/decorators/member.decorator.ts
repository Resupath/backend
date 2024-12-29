import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Guard } from 'src/interfaces/guard.interface';

export const Member = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const member = request?.member;

    return member as Guard.MemberResponse;
  },
);
