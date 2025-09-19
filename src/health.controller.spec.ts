import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns status ok", async () => {
    const modRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = modRef.get(HealthController);
    expect(controller.health()).toEqual({ status: "ok" });
  });
});
