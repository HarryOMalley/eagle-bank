import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: { name: string; type: "CURRENT" | "SAVINGS" },
  ) {
    return this.prisma.account.create({
      data: { userId, name: dto.name, type: dto.type },
      select: {
        id: true,
        userId: true,
        name: true,
        type: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        name: true,
        type: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(requestingUserId: string, accountId: string) {
    const acc = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true, name: true, type: true, balance: true },
    });
    if (!acc) throw new NotFoundException("Account not found");
    if (acc.userId !== requestingUserId)
      throw new ForbiddenException("Forbidden");
    return acc;
  }

  async update(
    requestingUserId: string,
    accountId: string,
    dto: { name?: string },
  ) {
    const acc = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true },
    });
    if (!acc) throw new NotFoundException("Account not found");
    if (acc.userId !== requestingUserId)
      throw new ForbiddenException("Forbidden");

    return this.prisma.account.update({
      where: { id: accountId },
      data: dto,
      select: {
        id: true,
        userId: true,
        name: true,
        type: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(requestingUserId: string, accountId: string) {
    const acc = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true },
    });
    if (!acc) throw new NotFoundException("Account not found");
    if (acc.userId !== requestingUserId)
      throw new ForbiddenException("Forbidden");

    await this.prisma.account.delete({ where: { id: accountId } });
    return { status: "deleted" };
  }
}
