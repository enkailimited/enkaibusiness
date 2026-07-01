"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, X, Plus, Minus, ShoppingCart, User, Receipt, Loader2, Circle, ShoppingBag, Scale, ExternalLink } from "lucide-react";
import { useActiveBranch } from "@/features/branches/context/active-branch-context";
import { BackButton } from "@/components/layout/back-button";
import type { ActionResponse } from "@/types/relationships";

type UnitType = "count" | "weight" | "volume" | "length";

interface MeasurementPreset {
  label: string;
  value: number;
  unit: string;
}

const WEIGHT_PRESETS: MeasurementPreset[] = [
  { label: "¼ kg", value: 0.25, unit: "kg" },
  { label: "½ kg", value: 0.5, unit: "kg" },
  { label: "¾ kg", value: 0.75, unit: "kg" },
  { label: "1 kg", value: 1, unit: "kg" },
  { label: "2 kg", value: 2, unit: "kg" },
  { label: "5 kg", value: 5, unit: "kg" },
];

const VOLUME_PRESETS: MeasurementPreset[] = [
  { label: "¼ L", value: 0.25, unit: "L" },
  { label: "½ L", value: 0.5, unit: "L" },
  { label: "¾ L", value: 0.75, unit: "L" },
  { label: "1 L", value: 1, unit: "L" },
  { label: "2 L", value: 2, unit: "L" },
  { label: "5 L", value: 5, unit: "L" },
];

const VOLUME_ML_PRESETS: MeasurementPreset[] = [
  { label: "100 ml", value: 100, unit: "ml" },
  { label: "200 ml", value: 200, unit: "ml" },
  { label: "300 ml", value: 300, unit: "ml" },
  { label: "500 ml", value: 500, unit: "ml" },
  { label: "1 L", value: 1000, unit: "ml" },
  { label: "1.5 L", value: 1500, unit: "ml" },
];

function getMeasurementPresets(unit: { name: string; abbreviation: string; type: string } | null): MeasurementPreset[] {
  if (!unit) return [];
  const abbr = unit.abbreviation.toLowerCase();
  const type = unit.type as UnitType;
  if (type === "weight" || abbr === "kg" || abbr === "g") return WEIGHT_PRESETS;
  if (type === "volume" || abbr === "l" || abbr === "lita" || abbr === "ml") {
    if (abbr === "ml") return VOLUME_ML_PRESETS;
    return VOLUME_PRESETS;
  }
  return [];
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
  trackStock: boolean;
  stockQuantity: number | null;
  unit: { name: string; abbreviation: string; type: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

interface ActiveSession {
  id: string;
  openedAt: string;
  openingFloat: number;
}

interface PosTerminalProps {
  businessId: string;
  workspaceId: string;
  businessName: string;
  products: Product[];
  categories: Category[];
  customers: Customer[];
  activeSession: ActiveSession | null;
}

export function POSTerminal({
  businessId,
  workspaceId,
  products,
  categories,
  customers,
  activeSession: initialSession,
}: PosTerminalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [session, setSession] = useState<ActiveSession | null>(initialSession);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [openFloat, setOpenFloat] = useState("0");
  const [closeFloat, setCloseFloat] = useState("");
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<"cash" | "credit" | "partial">("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartDrawerMaxHeight, setCartDrawerMaxHeight] = useState("calc(100dvh - 32px)");
  const [cartBounce, setCartBounce] = useState(false);
  const [measurementProduct, setMeasurementProduct] = useState<Product | null>(null);
  const [measurementInput, setMeasurementInput] = useState("1");
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const { activeBranch } = useActiveBranch();
  const prevCartLength = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cart.length > prevCartLength.current && prevCartLength.current > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 500);
      return () => clearTimeout(timer);
    }
    prevCartLength.current = cart.length;
  }, [cart.length]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const available = vv.height - (vv.offsetTop || 0) - 32;
      setCartDrawerMaxHeight(`${Math.max(available, 200)}px`);
    };
    vv.addEventListener("resize", update);
    update();
    return () => vv.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!initialSession) {
      (async () => {
        try {
          const { openSessionAction } = await import("@/features/pos/actions");
          const formData = new FormData();
          formData.set("openingFloat", "0");
          const result = await openSessionAction(businessId, null, formData) as ActionResponse<{ id: string }>;
          if (result.success && result.data) {
            setSession({ id: result.data.id, openedAt: new Date().toISOString(), openingFloat: 0 });
          }
        } catch {
          // silent — user can manually open session
        }
      })();
    }
  }, [initialSession, businessId]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  const addToCart = useCallback((product: Product) => {
    const presets = getMeasurementPresets(product.unit);
    if (presets.length > 0) {
      setMeasurementProduct(product);
      setMeasurementInput("1");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
    setMessage(null);
  }, []);

  const addWithMeasurement = useCallback((product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity, discount: 0 }];
    });
    setMeasurementProduct(null);
    setMessage(null);
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const updateDiscount = useCallback((productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discount: Math.max(0, discount) }
          : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setMessage(null);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );
  const discountTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.discount, 0),
    [cart],
  );
  const grandTotal = subtotal - discountTotal;

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;

    if (!session) {
      setMessage({ type: "error", text: "Cannot checkout without an active POS session. Please open a session first." });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("branchId", activeBranch?.id ?? "");
      formData.set("customerId", selectedCustomer || "");
      formData.set("status", "completed");
      formData.set("paymentType", paymentType);
      formData.set("amountPaid", paymentType === "credit" ? "0" : (paymentType === "partial" ? amountReceived : String(grandTotal)));
      formData.set("discountTotal", String(discountTotal));
      formData.set("taxTotal", "0");
      formData.set("itemCount", String(cart.length));

      cart.forEach((item, idx) => {
        formData.set(`items.${idx}.catalogItemId`, item.product.id);
        formData.set(`items.${idx}.quantity`, String(item.quantity));
        formData.set(`items.${idx}.unitPrice`, String(item.product.price));
        formData.set(`items.${idx}.discount`, String(item.discount));
        formData.set(`items.${idx}.subtotal`, String(item.product.price * item.quantity - item.discount));
      });

      const { createSaleAction } = await import("@/features/sales/actions");
      const result = await createSaleAction(businessId, workspaceId, null, formData);

      if (result.success) {
        setLastSaleId(result.data?.id ?? null);
        setMessage({ type: "success", text: "Sale completed successfully!" });
        setCart([]);
        setSelectedCustomer("");
        setPaymentType("cash");
        setAmountReceived("");
      } else {
        setMessage({ type: "error", text: result.message || "Checkout failed" });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Checkout failed",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cart, selectedCustomer, discountTotal, businessId, workspaceId, session, paymentType, amountReceived, grandTotal]);

  const selectedCustomerName = customers.find((c) => c.id === selectedCustomer);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {message && (
        <div
          className={`flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span>{message.text}</span>
          <div className="flex items-center gap-2">
            {message.type === "success" && lastSaleId && (
              <Link
                href={`/workspaces/businesses/${businessId}/commerce/sales/${lastSaleId}`}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <ExternalLink className="h-3 w-3" />
                View Sale
              </Link>
            )}
            <button onClick={() => setMessage(null)} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <BackButton />
          <Circle className={`h-2.5 w-2.5 ${session ? "fill-emerald-500 text-emerald-500" : "fill-red-400 text-red-400"}`} />
          <span>{session ? "Session Open" : "No Active Session"}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowSessionDialog(true)}
        >
          {session ? "Close Session" : "Open Session"}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-background p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-muted/50 pl-10 pr-4 text-sm outline-none focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div className="flex gap-1 flex-wrap border-b bg-muted/50 px-3 py-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                !selectedCategory
                  ? "bg-primary text-white"
                  : "bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/50 p-3">
            {filteredProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground/70">
                {searchQuery
                  ? "No products match your search"
                  : "No products available"}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group relative flex flex-col rounded-xl border border-border bg-background p-2 text-left shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
                  >
                    {product.trackStock && product.stockQuantity !== null && product.stockQuantity <= 0 && (
                      <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-semibold text-destructive shadow-sm">
                        Out
                      </span>
                    )}
                    {product.trackStock && product.stockQuantity !== null && product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                      <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold text-warning shadow-sm">
                        {product.stockQuantity}
                      </span>
                    )}
                    <div className="relative mb-1.5 overflow-hidden rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 aspect-square">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 transition-colors group-hover:from-primary/10 group-hover:to-primary/20">
                          <span className="text-xl font-bold text-primary/30 group-hover:text-primary transition-colors">
                            {product.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {product.unit?.type !== "count" && product.unit && (
                        <span className="absolute left-1 bottom-1 rounded-md bg-background/90 px-1 py-0.5 text-[9px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                          <Scale className="inline h-2.5 w-2.5 mr-0.5" />
                          {product.unit.abbreviation}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <div className="flex items-baseline gap-0.5 flex-wrap">
                        <span className="text-xs font-bold text-emerald-600">
                          {product.price.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground/70">TZS</span>
                        {product.unit && (
                          <span className="text-[9px] text-muted-foreground/70">/{product.unit.abbreviation}</span>
                        )}
                      </div>
                      {product.trackStock && product.stockQuantity !== null && product.stockQuantity > 5 && (
                        <span className="block text-[9px] text-muted-foreground/70">
                          {product.stockQuantity} in stock
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden w-full max-w-sm flex-col border-l bg-background lg:flex lg:max-w-md">
          <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-card-foreground">Cart</span>
              {cart.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/70">Cart is empty</p>
                <p className="text-xs text-muted-foreground/50">
                  Click products to add them
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {item.product.price.toLocaleString()} TZS
                          {item.product.unit && <span> /{item.product.unit.abbreviation}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="mt-0.5 text-muted-foreground/50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted/50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-7 w-10 items-center justify-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted/50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <input
                        type="number"
                        min="0"
                        placeholder="Disc"
                        value={item.discount || ""}
                        onChange={(e) =>
                          updateDiscount(item.product.id, parseFloat(e.target.value) || 0)
                        }
                        className="h-7 w-16 rounded-md border border-border px-1.5 text-right text-xs outline-none focus:border-primary/30"
                      />

                      <span className="w-20 text-right text-sm font-semibold text-foreground">
                        {(
                          item.product.price * item.quantity -
                          item.discount
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t bg-muted/50 p-4">
            <div className="relative mb-3">
              {showCustomers ? (
                <div>
                  <input
                    type="text"
                    placeholder="Search customer..."
                    className="h-9 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary/30"
                    autoFocus
                  />
                  <div className="absolute z-10 mt-1 max-h-32 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                    <button
                      onClick={() => {
                        setSelectedCustomer("");
                        setShowCustomers(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                      Walk-in Customer
                    </button>
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c.id);
                          setShowCustomers(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>
                          {c.firstName} {c.lastName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomers(true)}
                  className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm text-muted-foreground hover:border-accent"
                >
                  <User className="h-4 w-4 text-muted-foreground/70" />
                  {selectedCustomerName
                    ? `${selectedCustomerName.firstName} ${selectedCustomerName.lastName || ""}`
                    : "Walk-in Customer"}
                </button>
              )}
            </div>

            <div className="mb-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString()}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>-{discountTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold text-foreground">
                <span>Total</span>
                <span className="text-emerald-600">
                  {grandTotal.toLocaleString()} TZS
                </span>
              </div>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex gap-1">
                {(["cash", "partial", "credit"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setPaymentType(type); if (type === "cash") setAmountReceived(String(grandTotal)); }}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      paymentType === type
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {type === "cash" ? "Cash" : type === "partial" ? "Partial" : "Credit"}
                  </button>
                ))}
              </div>
              {paymentType === "partial" && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Amount received"
                    className="h-9 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-primary/30"
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">
                    Change: {Math.max(0, (parseFloat(amountReceived) || 0) - grandTotal).toLocaleString()}
                  </span>
                </div>
              )}
              {paymentType === "credit" && (
                <p className="text-xs text-amber-600 text-center">Credit sale — invoice will be marked unpaid</p>
              )}
            </div>

            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing || (paymentType === "partial" && (!amountReceived || parseFloat(amountReceived) <= 0))}
              className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-5 w-5" />
                  {paymentType === "credit" ? "Credit Sale" : `Checkout — ${grandTotal.toLocaleString()} TZS`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className={`sticky bottom-0 z-30 border-t bg-background px-3 py-2 shadow-lg transition-all duration-300 lg:hidden ${cart.length === 0 ? "opacity-60" : "opacity-100"}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="flex flex-1 items-center gap-2"
          >
            <div className="relative">
              <ShoppingBag className={`h-5 w-5 text-primary transition-transform duration-300 ${cartBounce ? "scale-125" : "scale-100"}`} />
              {cart.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white animate-in zoom-in">
                  {cart.length}
                </span>
              )}
            </div>
            <span className={`text-sm font-semibold transition-colors ${cart.length > 0 ? "text-card-foreground" : "text-muted-foreground/70"}`}>
              {cart.length > 0 ? `${grandTotal.toLocaleString()} TZS` : "Cart is empty"}
            </span>
          </button>
          {cart.length > 0 && (
            <Button
              size="sm"
              onClick={() => setCartDrawerOpen(true)}
              className="rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90"
            >
              View Cart
            </Button>
          )}
        </div>
      </div>

      <Drawer.Root open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} repositionInputs fixed>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Drawer.Content
            style={{ maxHeight: cartDrawerMaxHeight }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-background pb-[env(safe-area-inset-bottom,16px)]">
            <DialogTitle className="sr-only">Cart</DialogTitle>
            <DialogDescription className="sr-only">Shopping cart items and checkout</DialogDescription>
            <div className="mx-auto mb-2 mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
            <div className="flex-1 overflow-y-auto px-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-card-foreground">Cart</span>
                  {cart.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {cart.length}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700">Clear</button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground/70">Cart is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cart.map((item) => (
                    <div key={item.product.id} className="py-2.5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="truncate text-sm font-medium text-foreground">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground/70">{item.product.price.toLocaleString()} TZS</p>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground/50 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted/50">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="flex h-7 w-10 items-center justify-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted/50">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <input
                          type="number" min="0" placeholder="Disc"
                          value={item.discount || ""}
                          onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                          className="h-7 w-16 rounded-md border border-border px-1.5 text-right text-xs outline-none focus:border-primary/30"
                        />
                        <span className="w-20 text-right text-sm font-semibold text-foreground">
                          {(item.product.price * item.quantity - item.discount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t bg-muted/50 px-4 pb-4 pt-3">
                <div className="mb-2 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>{subtotal.toLocaleString()}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount</span><span>-{discountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-1 text-base font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-emerald-600">{grandTotal.toLocaleString()} TZS</span>
                  </div>
                </div>

                <div className="relative mb-2">
                  {showCustomers ? (
                    <div>
                      <input
                        type="text" placeholder="Search customer..."
                        className="h-9 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary/30"
                        autoFocus
                      />
                      <div className="absolute z-10 mt-1 max-h-32 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                        <button onClick={() => { setSelectedCustomer(""); setShowCustomers(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50">
                          <User className="h-3.5 w-3.5 text-muted-foreground/70" /> Walk-in Customer
                        </button>
                        {customers.map((c) => (
                          <button key={c.id} onClick={() => { setSelectedCustomer(c.id); setShowCustomers(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50">
                            <User className="h-3.5 w-3.5 text-muted-foreground/70" /> {c.firstName} {c.lastName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowCustomers(true)} className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm text-muted-foreground hover:border-accent">
                      <User className="h-4 w-4 text-muted-foreground/70" />
                      {selectedCustomerName ? `${selectedCustomerName.firstName} ${selectedCustomerName.lastName || ""}` : "Walk-in Customer"}
                    </button>
                  )}
                </div>

                <div className="mb-2 flex gap-1">
                  {(["cash", "partial", "credit"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setPaymentType(type); if (type === "cash") setAmountReceived(String(grandTotal)); }}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                        paymentType === type ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {type === "cash" ? "Cash" : type === "partial" ? "Partial" : "Credit"}
                    </button>
                  ))}
                </div>
                {paymentType === "partial" && (
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="number" min="0" max={grandTotal}
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="Amount received"
                      className="h-9 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-primary/30"
                      autoFocus
                    />
                    <span className="text-xs text-muted-foreground">Change: {Math.max(0, (parseFloat(amountReceived) || 0) - grandTotal).toLocaleString()}</span>
                  </div>
                )}
                {paymentType === "credit" && (
                  <p className="mb-2 text-center text-xs text-amber-600">Credit sale — invoice will be marked unpaid</p>
                )}

                <Button
                  onClick={() => { handleCheckout(); setCartDrawerOpen(false); }}
                  disabled={cart.length === 0 || isProcessing || (paymentType === "partial" && (!amountReceived || parseFloat(amountReceived) <= 0))}
                  className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Receipt className="mr-2 h-4 w-4" /> {paymentType === "credit" ? "Credit Sale" : `Checkout — ${grandTotal.toLocaleString()} TZS`}</>
                  )}
                </Button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{session ? "Close POS Session" : "Open POS Session"}</DialogTitle>
          </DialogHeader>
          {session ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSessionLoading(true);
                setMessage(null);
                try {
                  const { closeSessionAction } = await import("@/features/pos/actions");
                  const formData = new FormData();
                  formData.set("closingFloat", closeFloat || "0");
                  const result = await closeSessionAction(session.id, businessId, null, formData);
                  if (result.success) {
                    window.location.reload();
                  } else {
                    setMessage({ type: "error", text: result.message || "Failed to close session" });
                  }
                } catch (err) {
                  setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to close session" });
                } finally {
                  setIsSessionLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Closing Float (TZS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={closeFloat}
                  onChange={(e) => setCloseFloat(e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary/30"
                  placeholder="Enter closing float amount"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isSessionLoading} className="w-full">
                {isSessionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Close Session
              </Button>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSessionLoading(true);
                setMessage(null);
                try {
                  const { openSessionAction } = await import("@/features/pos/actions");
                  const formData = new FormData();
                  formData.set("openingFloat", openFloat || "0");
                  const result = await openSessionAction(businessId, null, formData);
                  if (result.success) {
                    window.location.reload();
                  } else {
                    setMessage({ type: "error", text: result.message || "Failed to open session" });
                  }
                } catch (err) {
                  setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to open session" });
                } finally {
                  setIsSessionLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Opening Float (TZS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openFloat}
                  onChange={(e) => setOpenFloat(e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary/30"
                  placeholder="Enter opening float amount"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isSessionLoading} className="w-full">
                {isSessionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Open Session
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={measurementProduct !== null} onOpenChange={(open) => { if (!open) setMeasurementProduct(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {measurementProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Chagua kipimo au ingiza kiasi
            </DialogDescription>
          </DialogHeader>
          {measurementProduct && (() => {
            const presets = getMeasurementPresets(measurementProduct.unit);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => addWithMeasurement(measurementProduct, preset.value)}
                      className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-3 text-center transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-95"
                    >
                      <span className="text-sm font-semibold text-foreground">{preset.label}</span>
                      <span className="mt-0.5 text-xs font-medium text-emerald-600">
                        {(measurementProduct.price * preset.value).toLocaleString()} TZS
                      </span>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground/70">au ingiza kiasi</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={measurementInput}
                    onChange={(e) => setMeasurementInput(e.target.value)}
                    className="h-11 flex-1 rounded-xl border border-border px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    placeholder="Kiasi"
                    autoFocus
                  />
                  {measurementProduct.unit && (
                    <span className="text-sm font-medium text-muted-foreground w-8">{measurementProduct.unit.abbreviation}</span>
                  )}
                  <Button
                    onClick={() => addWithMeasurement(measurementProduct, parseFloat(measurementInput) || 1)}
                    className="h-11 rounded-xl bg-primary px-4 text-white hover:bg-primary/90"
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
