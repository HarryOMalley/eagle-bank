import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { UpdateUserSchema } from "./users.schemas";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get(":userId")
  async find(
    @Param("userId") userId: string,
    @CurrentUser() me: { userId: string },
  ) {
    return this.users.findById(me.userId, userId);
  }

  @Patch(":userId")
  async update(
    @Param("userId") userId: string,
    @Body() body: z.infer<typeof UpdateUserSchema>,
    @CurrentUser() me: { userId: string },
  ) {
    UpdateUserSchema.parse(body);
    return this.users.update(me.userId, userId, body);
  }

  @Delete(":userId")
  async remove(
    @Param("userId") userId: string,
    @CurrentUser() me: { userId: string },
  ) {
    return this.users.remove(me.userId, userId);
  }
}
