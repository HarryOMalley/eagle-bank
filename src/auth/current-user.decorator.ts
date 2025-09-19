import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface CurrentUser {
  userId: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUser;
  },
);
