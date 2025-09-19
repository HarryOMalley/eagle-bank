import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AccountsService } from "../../src/accounts/accounts.service";
import type { PrismaService } from "../../src/prisma/prisma.service";

type AccountRow = {
  id: string;
  userId: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: any; // Prisma Decimal; we treat as any in the mock
  createdAt: Date;
  updatedAt: Date;
};

// Narrow Prisma mock exposing only what we use
class MockPrisma implements Pick<PrismaService, "account"> {
  account = {
    create: jest.fn<Promise<AccountRow>, [any]>(),
    findMany: jest.fn<Promise<AccountRow[]>, [any]>(),
    findUnique: jest.fn<
      Promise<Pick<
        AccountRow,
        "id" | "userId" | "name" | "type" | "balance"
      > | null>,
      [any]
    >(),
    update: jest.fn<Promise<AccountRow>, [any]>(),
    delete: jest.fn<Promise<void>, [any]>(),
  };
}

describe("AccountsService (unit)", () => {
  let service: AccountsService;
  let prisma: MockPrisma;
  const now = new Date();

  const accOwned: AccountRow = {
    id: "a1",
    userId: "u1",
    name: "Main",
    type: "CURRENT",
    balance: { toString: () => "0" },
    createdAt: now,
    updatedAt: now,
  };

  const accOther: AccountRow = {
    ...accOwned,
    id: "a2",
    userId: "u2",
    name: "Other",
  };

  beforeEach(() => {
    prisma = new MockPrisma();
    service = new AccountsService(prisma as unknown as PrismaService);
    jest.resetAllMocks();
  });

  // create
  it("create: creates account for current user", async () => {
    prisma.account.create.mockResolvedValue(accOwned);
    const result = await service.create("u1", {
      name: "Main",
      type: "CURRENT",
    });
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: { userId: "u1", name: "Main", type: "CURRENT" },
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
    expect(result).toEqual(
      expect.objectContaining({
        id: "a1",
        userId: "u1",
        name: "Main",
        type: "CURRENT",
      }),
    );
  });

  // list
  it("listForUser: returns only current user's accounts", async () => {
    prisma.account.findMany.mockResolvedValue([accOwned]);
    const out = await service.listForUser("u1");
    expect(prisma.account.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
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
    expect(out).toHaveLength(1);
    expect(out[0].userId).toBe("u1");
  });

  // get by id
  it("findById: returns owned account", async () => {
    prisma.account.findUnique.mockResolvedValue(accOwned);
    const out = await service.findById("u1", "a1");
    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { id: "a1" },
      select: { id: true, userId: true, name: true, type: true, balance: true },
    });
    expect(out.id).toBe("a1");
  });

  it("findById: 404 when account missing", async () => {
    prisma.account.findUnique.mockResolvedValue(null);
    await expect(service.findById("u1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("findById: 403 when not owned", async () => {
    prisma.account.findUnique.mockResolvedValue(accOther);
    await expect(service.findById("u1", "a2")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // update
  it("update: updates owned account", async () => {
    prisma.account.findUnique.mockResolvedValue(accOwned);
    prisma.account.update.mockResolvedValue({ ...accOwned, name: "Primary" });
    const out = await service.update("u1", "a1", { name: "Primary" });
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { name: "Primary" },
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
    expect(out.name).toBe("Primary");
  });

  it("update: 404 when missing", async () => {
    prisma.account.findUnique.mockResolvedValue(null);
    await expect(
      service.update("u1", "missing", { name: "X" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("update: 403 when not owned", async () => {
    prisma.account.findUnique.mockResolvedValue(accOther);
    await expect(
      service.update("u1", "a2", { name: "X" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // remove
  it("remove: deletes owned account", async () => {
    prisma.account.findUnique.mockResolvedValue(accOwned);
    prisma.account.delete.mockResolvedValue();
    const out = await service.remove("u1", "a1");
    expect(prisma.account.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
    expect(out).toEqual({ status: "deleted" });
  });

  it("remove: 404 when missing", async () => {
    prisma.account.findUnique.mockResolvedValue(null);
    await expect(service.remove("u1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("remove: 403 when not owned", async () => {
    prisma.account.findUnique.mockResolvedValue(accOther);
    await expect(service.remove("u1", "a2")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
