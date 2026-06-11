import type { Store } from "@/types/models";

export type { Store };

export interface StoreWithBranch extends Store {
  branch?: { id: string; name: string };
}
