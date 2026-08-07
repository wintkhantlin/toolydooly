import { createParamDecorator } from "@nestjs/common";
import type { Request } from "express";

export const User = createParamDecorator((data, context) => {
    const request: Request = context.switchToHttp().getRequest();

    return request.user;
})