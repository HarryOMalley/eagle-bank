import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { LoginSchema, RegisterSchema } from "./auth.schemas";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  async register(@Body() body: z.infer<typeof RegisterSchema>) {
    RegisterSchema.parse(body);
    return this.auth.register(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: z.infer<typeof LoginSchema>) {
    LoginSchema.parse(body);
    return this.auth.login(body.email, body.password);
  }
}
