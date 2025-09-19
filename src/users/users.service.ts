import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private ensureSelf(requestingUserId: string, targetUserId: string) {
    if (requestingUserId !== targetUserId)
      throw new ForbiddenException("Forbidden");
  }

  async findById(requestingUserId: string, userId: string) {
    this.ensureSelf(requestingUserId, userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async update(
    requestingUserId: string,
    userId: string,
    data: { firstName?: string; lastName?: string },
  ) {
    this.ensureSelf(requestingUserId, userId);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (e) {
      // Prisma throws if not found
      throw new NotFoundException("User not found");
    }
  }

  async remove(requestingUserId: string, userId: string) {
    this.ensureSelf(requestingUserId, userId);

    const accounts = await this.prisma.account.count({ where: { userId } });
    if (accounts > 0) throw new ConflictException("User has bank accounts");

    try {
      await this.prisma.user.delete({ where: { id: userId } });
      return { status: "deleted" };
    } catch (e) {
      throw new NotFoundException("User not found");
    }
  }
}
