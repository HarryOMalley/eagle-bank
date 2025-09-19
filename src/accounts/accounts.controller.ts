import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AccountsService } from "./accounts.service";
import { CreateAccountSchema, UpdateAccountSchema } from "./accounts.schemas";

@UseGuards(JwtAuthGuard)
@Controller("accounts")
export class AccountsController {
  constructor(private accounts: AccountsService) {}

  @Post()
  async create(
    @Body() body: z.infer<typeof CreateAccountSchema>,
    @CurrentUser() me: { userId: string },
  ) {
    CreateAccountSchema.parse(body);
    return this.accounts.create(me.userId, body);
  }

  @Get()
  async list(@CurrentUser() me: { userId: string }) {
    return this.accounts.listForUser(me.userId);
  }

  @Get(":accountId")
  async getOne(
    @Param("accountId") accountId: string,
    @CurrentUser() me: { userId: string },
  ) {
    return this.accounts.findById(me.userId, accountId);
  }

  @Patch(":accountId")
  async update(
    @Param("accountId") accountId: string,
    @Body() body: z.infer<typeof UpdateAccountSchema>,
    @CurrentUser() me: { userId: string },
  ) {
    UpdateAccountSchema.parse(body);
    return this.accounts.update(me.userId, accountId, body);
  }

  @Delete(":accountId")
  async remove(
    @Param("accountId") accountId: string,
    @CurrentUser() me: { userId: string },
  ) {
    return this.accounts.remove(me.userId, accountId);
  }
}
