// Minimal Prisma mock for unit tests.
// Extend as you add more model calls (user, account, etc.).
export function createPrismaMock() {
  return {
    $queryRaw: jest.fn(),
  };
}
