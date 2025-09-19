import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { UsersService } from "../../src/users/users.service";
import type { PrismaService } from "../../src/prisma/prisma.service";

// A minimal, strongly-typed mock for the Prisma bits UsersService touches.
// We avoid 'any' and only expose the methods under test.
class MockPrisma implements Pick<PrismaService, "user" | "account"> {
  user = {
    findUnique: jest.fn<
      Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
      } | null>,
      [
        args: { where: { id: string } } | { where: { email: string } },
        ...unknown[],
      ]
    >(),
    update: jest.fn<
      Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
      }>,
      [
        args: {
          where: { id: string };
          data: { firstName?: string; lastName?: string };
        },
      ]
    >(),
    delete: jest.fn<Promise<void>, [args: { where: { id: string } }]>(),
  };

  account = {
    count: jest.fn<Promise<number>, [args: { where: { userId: string } }]>(),
  };
}

describe("UsersService (unit)", () => {
  let service: UsersService;
  let prisma: MockPrisma;

  const now = new Date();
  const user = {
    id: "u1",
    email: "user@example.com",
    firstName: "User",
    lastName: "Example",
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    prisma = new MockPrisma();
    service = new UsersService(prisma as unknown as PrismaService);
    jest.resetAllMocks();
  });

  // ---------- findById ----------
  it("findById: returns own user", async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.findById("u1", "u1");

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" } }),
    );
    expect(result).toEqual(user);
  });

  it("findById: forbids reading another user (403)", async () => {
    await expect(service.findById("u1", "u2")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("findById: 404 when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findById("u1", "u1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // ---------- update ----------
  it("update: updates own profile", async () => {
    prisma.user.update.mockResolvedValue({
      ...user,
      firstName: "Alice",
      updatedAt: new Date(),
    });

    const result = await service.update("u1", "u1", { firstName: "Alice" });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { firstName: "Alice" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result.firstName).toBe("Alice");
  });

  it("update: forbids updating another user (403)", async () => {
    await expect(
      service.update("u1", "u2", { firstName: "Nope" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("update: 404 when user does not exist", async () => {
    prisma.user.update.mockRejectedValue(
      new Error("Record to update not found."),
    );

    await expect(
      service.update("u1", "u1", { firstName: "X" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // ---------- remove ----------
  it("remove: deletes self when there are no accounts", async () => {
    prisma.account.count.mockResolvedValue(0);
    prisma.user.delete.mockResolvedValue();

    const result = await service.remove("u1", "u1");

    expect(prisma.account.count).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
    expect(result).toEqual({ status: "deleted" });
  });

  it("remove: forbids deleting another user (403)", async () => {
    await expect(service.remove("u1", "u2")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("remove: 409 when accounts exist", async () => {
    prisma.account.count.mockResolvedValue(2);

    await expect(service.remove("u1", "u1")).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("remove: 404 when user does not exist", async () => {
    prisma.account.count.mockResolvedValue(0);
    prisma.user.delete.mockRejectedValue(
      new Error("Record to delete does not exist."),
    );

    await expect(service.remove("u1", "u1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
