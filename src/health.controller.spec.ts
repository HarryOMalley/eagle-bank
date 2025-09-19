import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { PrismaService } from "./prisma/prisma.service";
import { createPrismaMock } from "./prisma/prisma.mock";

describe("HealthController", () => {
  let controller: HealthController;
  const prismaMock = createPrismaMock();

  beforeEach(async () => {
    // Reset mock call history between tests
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = moduleRef.get<HealthController>(HealthController);
  });

  it("GET /health -> { status: 'ok' }", () => {
    expect(controller.health()).toEqual({ status: "ok" });
  });

  it("GET /health/db -> returns mocked DB payload and calls $queryRaw once", async () => {
    const fakeResults = [{ ok: 1 }];
    prismaMock.$queryRaw.mockResolvedValueOnce(fakeResults);

    await expect(controller.db()).resolves.toEqual({ db: fakeResults });
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
