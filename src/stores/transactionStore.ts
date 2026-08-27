// Legacy store — kept for type compatibility only.
// All new code uses src/lib/exchangeStore.ts (Supabase-backed).
export const transactionStore = {
  getAll: () => [],
  getById: (_id: string) => undefined,
  getForBorrower: (_userId: string) => [],
  getForOwner: (_userId: string) => [],
  create: (tx: any) => tx,
  advance: (_id: string, _status: any, _note?: string) => undefined,
  updateInspection: () => undefined,
  raiseDispute: () => undefined,
  resolveDispute: () => undefined,
  addRating: () => undefined,
  reset: () => {},
};
