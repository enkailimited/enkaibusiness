"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useFirdausContext } from "../provider/firdaus-context";

export function useFirdaus() {
  const { state, actions } = useFirdausContext();
  return { ...state, ...actions };
}

export function useFirdausBusiness(businessId: string, userId: string, staffId?: string) {
  const { actions } = useFirdausContext();

  useEffect(() => {
    actions.setBusinessContext({ businessId, userId, staffId });
  }, [businessId, userId, staffId, actions]);
}

export type PageContext = {
  page: string;
  businessId: string | null;
  entityId: string | null;
  entityType: string | null;
};

export function usePageContext(): PageContext {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  let page = "unknown";
  let businessId: string | null = null;
  let entityId: string | null = null;
  let entityType: string | null = null;

  if (segments.includes("dashboard")) page = "dashboard";
  else if (segments.includes("sales")) page = "sales";
  else if (segments.includes("inventory")) page = "inventory";
  else if (segments.includes("purchases")) page = "purchases";
  else if (segments.includes("expenses")) page = "expenses";
  else if (segments.includes("customers")) page = "customers";
  else if (segments.includes("suppliers")) page = "suppliers";
  else if (segments.includes("reports")) page = "reports";
  else if (segments.includes("products")) page = "products";
  else if (segments.includes("stores")) page = "stores";
  else if (segments.includes("branches")) page = "branches";
  else if (segments.includes("staff")) page = "staff";
  else if (segments.includes("settings")) page = "settings";
  else if (segments.includes("sales-team") || segments.includes("team")) page = "sales-team";

  const businessIdx = segments.indexOf("businesses");
  if (businessIdx !== -1 && segments[businessIdx + 1]) {
    businessId = segments[businessIdx + 1];
  }

  if (page === "products" && segments[segments.length - 2] === "products") {
    entityId = segments[segments.length - 1] || null;
    entityType = "product";
  } else if (page === "customers" && segments[segments.length - 2] === "customers") {
    entityId = segments[segments.length - 1] || null;
    entityType = "customer";
  } else if (page === "suppliers" && segments[segments.length - 2] === "suppliers") {
    entityId = segments[segments.length - 1] || null;
    entityType = "supplier";
  }

  return { page, businessId, entityId, entityType };
}
