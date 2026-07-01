"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface NavbarSlotsContextType {
  branchSwitcher: ReactNode | null;
  setBranchSwitcher: (node: ReactNode | null) => void;
}

const NavbarSlotsContext = createContext<NavbarSlotsContextType>({
  branchSwitcher: null,
  setBranchSwitcher: () => {},
});

export function useNavbarSlots() {
  return useContext(NavbarSlotsContext);
}

export function NavbarSlotsProvider({ children }: { children: ReactNode }) {
  const [branchSwitcher, setBranchSwitcher] = useState<ReactNode | null>(null);

  return (
    <NavbarSlotsContext.Provider value={{ branchSwitcher, setBranchSwitcher }}>
      {children}
    </NavbarSlotsContext.Provider>
  );
}
