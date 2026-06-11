import type { Branch, Store } from "@/types/models";

export type { Branch };

export interface BranchWithStores extends Branch {
  stores: Store[];
}

export interface BranchWithCount extends Branch {
  _count: { stores: number };
}
