import { Controller, Get } from "@nestjs/common";

import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  health() {
    return { status: "ok" };
  }
  @Get("db")
  async db() {
    const results = await this.prisma.$queryRaw`SELECT ALL`;
    return { db: results };
  }
}
