# 8. STOREFRONT ARCHITECTURE

## Strategy

Every business gets its own public-facing storefront. The storefront is:

1. **Industry-adaptive** — Resolves via Industry Engine
2. **Multi-tenant** — One deployment serves all businesses
3. **Configurable** — Branding, theme, pages, sections
4. **SEO-optimized** — SSR via Next.js
5. **Public** — No auth required for browsing

## Domain Model

```
[business-slug].enkai.app     → Storefront
                              → Resolves business by slug
                              → Renders industry-adaptive storefront
                              
custom-domain.com             → Custom domain (CNAME → enkai.app)
                              → Verified via DNS record
```

## Route Structure

```
/[businessSlug]/                        → Storefront homepage
/[businessSlug]/catalog                 → Catalog listing (industry-adaptive)
/[businessSlug]/catalog/[slug]          → Item detail
/[businessSlug]/categories/[slug]       → Category listing
/[businessSlug]/cart                    → Cart
/[businessSlug]/checkout                → Checkout
/[businessSlug]/booking                 → Booking form (healthcare, hotel)
/[businessSlug]/menu                    → Restaurant menu
/[businessSlug]/reserve                 → Reservation (restaurant)
/[businessSlug]/appointments            → Appointments (healthcare)
/[businessSlug]/admissions              → Admissions (education)
/[businessSlug]/track/[orderId]         → Order tracking
/[businessSlug]/about                   → Business info
/[businessSlug]/contact                 → Contact form
/[businessSlug]/faq                     → FAQ

/api/storefront/[businessSlug]/*        → Storefront APIs
```

## Industry-Adaptive Pages

Each industry defines which storefront pages are active:

```typescript
// Industry Registry — storefront pages
industries: {
  commerce: {
    storefrontPages: [
      { slug: "catalog", label: "Shop", isDefault: true },
      { slug: "cart", label: "Cart" },
      { slug: "checkout", label: "Checkout" },
      { slug: "track", label: "Track Order" },
      { slug: "about", label: "About Us" },
      { slug: "contact", label: "Contact" },
    ],
  },
  restaurant: {
    storefrontPages: [
      { slug: "menu", label: "Menu", isDefault: true },
      { slug: "reserve", label: "Reserve a Table" },
      { slug: "cart", label: "Order" },
      { slug: "checkout", label: "Checkout" },
      { slug: "about", label: "About Us" },
    ],
  },
  healthcare: {
    storefrontPages: [
      { slug: "services", label: "Services", isDefault: true },
      { slug: "appointments", label: "Book Appointment" },
      { slug: "about", label: "About Us" },
      { slug: "contact", label: "Contact" },
      { slug: "faq", label: "FAQ" },
    ],
  },
  education: {
    storefrontPages: [
      { slug: "admissions", label: "Admissions", isDefault: true },
      { slug: "programs", label: "Programs" },
      { slug: "fees", label: "Fee Structure" },
      { slug: "about", label: "About Us" },
      { slug: "contact", label: "Contact" },
    ],
  },
}
```

## Storefront Configuration

Stored in `Storefront` + `StorefrontTheme` models (already exist):

```typescript
interface StorefrontConfig {
  business: {
    name: string;
    logo?: string;
    colors: {
      primary: string;    // #2563eb
      secondary: string;  // #f59e0b
      accent: string;     // #10b981
    };
  };
  theme: {
    template: "modern" | "classic" | "minimal";
    font: "inter" | "playfair" | "poppins";
    layout: "full-width" | "boxed";
  };
  pages: {
    homepage: {
      hero: { title: string; subtitle: string; image: string; cta: string };
      sections: StorefrontSection[];
    };
    catalog: {
      layout: "grid" | "list";
      itemsPerPage: number;
    };
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
  };
}
```

## Storefront Middleware

```typescript
// src/middleware.ts (storefront subdomain detection)
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const isStorefront = hostname.endsWith(".enkai.app")
    || customDomains.has(hostname);

  if (isStorefront) {
    const slug = hostname.split(".")[0]; // subdomain
    // Rewrite to storefront route with business slug
    return NextResponse.rewrite(
      new URL(`/storefront/${slug}${request.nextUrl.pathname}`, request.url)
    );
  }
}

export const config = {
  matcher: ["/((?!api|_next|_static|favicon.ico).*)"],
};
```

## Performance

| Strategy | Implementation |
|----------|---------------|
| SSR | Next.js server components |
| ISR | Incremental Static Regeneration for catalog pages |
| CDN | Vercel Edge / Cloudflare for assets |
| Image Opt | Next.js Image with remote patterns |
| Caching | `stale-while-revalidate` headers |
| Fonts | Self-hosted, subset fonts |
