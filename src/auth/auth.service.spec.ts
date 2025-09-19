import { AuthService } from "../../src/auth/auth.service";
import { JwtService } from "@nestjs/jwt";

class MockPrisma {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
}

describe("AuthService (unit)", () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let jwt: JwtService;

  beforeEach(() => {
    prisma = new MockPrisma();
    jwt = {
      signAsync: jest.fn().mockResolvedValue("jwt-token"),
    } as unknown as JwtService;
    service = new AuthService(prisma as any, jwt);
  });

  describe("register", () => {
    it("creates a new user when email is not taken", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "u1",
        email: "a@example.com",
        firstName: "A",
        lastName: "E",
        createdAt: new Date(),
      });

      const result = await service.register({
        email: "a@example.com",
        password: "verysecurepassword",
        firstName: "A",
        lastName: "E",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "a@example.com" },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      // Should not return passwordHash
      expect(result).toEqual(
        expect.objectContaining({
          id: "u1",
          email: "a@example.com",
          firstName: "A",
          lastName: "E",
        }),
      );
    });

    it("rejects when email already exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u1" });
      await expect(
        service.register({
          email: "a@example.com",
          password: "verysecurepassword",
          firstName: "A",
          lastName: "E",
        }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe("login", () => {
    it("returns a token for valid credentials", async () => {
      // bcryptjs.compare will be used; stub by storing a real hash or monkey patch compare
      // Simplest: set a known hash for "verysecurepassword"
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
      const passwordHash = await bcrypt.hash("verysecurepassword", 4);

      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "a@example.com",
        passwordHash,
      });

      const result = await service.login("a@example.com", "verysecurepassword");
      expect(result).toEqual(
        expect.objectContaining({
          accessToken: "jwt-token",
          tokenType: "Bearer",
          expiresIn: expect.any(Number),
        }),
      );
    });

    it("rejects on invalid email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login("missing@example.com", "x"),
      ).rejects.toMatchObject({ status: 401 });
    });

    it("rejects on invalid password", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "a@example.com",
        passwordHash:
          "$2a$04$123456789012345678901u6Jxk0wR3l1jU4U4uQdEw2kH0o5p6QK", // not matching
      });
      await expect(
        service.login("a@example.com", "wrong"),
      ).rejects.toMatchObject({ status: 401 });
    });
  });
});
