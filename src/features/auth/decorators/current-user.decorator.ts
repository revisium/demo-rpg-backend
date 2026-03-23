import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IAuthUser } from '../types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthUser | undefined => {
    const contextType = context.getType() as string;

    if (contextType === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req?.user;
    }

    return context.switchToHttp().getRequest().user;
  },
);
