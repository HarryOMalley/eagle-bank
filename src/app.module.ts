import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AccountsModule } from "./accounts/accounts.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AccountsModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
