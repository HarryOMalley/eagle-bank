import { JwtStrategy } from "../../src/auth/jwt.strategy";

describe("JwtStrategy (unit)", () => {
  it("validate returns user identity", async () => {
    const strategy = new JwtStrategy();
    const out = await strategy.validate({ sub: "u1", email: "a@example.com" });
    expect(out).toEqual({ userId: "u1", email: "a@example.com" });
  });
});
