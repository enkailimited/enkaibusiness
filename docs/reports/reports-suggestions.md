# Firdaus Reports — Mapendekezo

**Tarehe**: 2026-06-12
**Lengo**: Kupanua ripoti ambazo Firdaus anaweza kutoa kwa ajili ya biashara za Tanzania

---

## Hali ya Sasa

Firdaus kwa sasa ana ripoti **5 tu** kwenye `tool-registry.ts`:

| Report | Keyword | Implementation |
|--------|---------|----------------|
| Sales | `sales` / `mauzo` | ✅ Count + total revenue |
| Profit | `profit` / `faida` | ✅ Revenue, cost, margin |
| Stock | `stock` / `hesabu` | ✅ Items, value, low stock |
| Expenses | `expenses` / `gharama` | ✅ Count + total |
| Staff | `staff` | ❌ Placeholder tu |

Ripoti zote zinatumia kipindi cha siku 30 default. Hakuna ripoti za leo, wiki, au mwezi. Hakuna ripoti za wateja, wadeni, au bidhaa bora.

---

## Mapendekezo Kamili

### Kundi A — Ripoti za Kila Siku (Daily Basics)

| Jina | Swahili | Keywords | Data Source | Priority |
|------|---------|----------|-------------|----------|
| Daily Sales | Mauzo ya Leo | `leo`, `mauzo leo`, `sold today` | Sale kwa tarehe ya leo | **HIGH** |
| Daily Cash | Muhtasari wa Pesa | `cash`, `hela`, `pesa leo` | Payments grouped by method (cash, mobile, bank) | **HIGH** |
| Daily Expenses | Gharama za Leo | `gharama leo`, `matumizi leo` | Expense filtered by today | **HIGH** |
| Daily Debtors | Wadeni Leo | `wadeni`, `deni`, `wanadaiwa` | CustomerCredit where due = today | **HIGH** |

### Kundi B — Ripoti za Muda (Period Reports)

| Jina | Swahili | Keywords | Data Source | Priority |
|------|---------|----------|-------------|----------|
| Weekly Sales | Mauzo ya Wiki | `wiki`, `wiki hii`, `this week` | Sale groupBy week | **HIGH** |
| Monthly Sales | Mauzo ya Mwezi | `mwezi`, `mwezi huu`, `this month` | Sale groupBy month | **HIGH** |
| Best Sellers | Bidhaa Zinazouza | `bidhaa`, `best seller`, `popular` | SaleItem groupBy product, sum quantity | **MEDIUM** |
| Profit Report | Faida na Hasara | `faida`, `hasara`, `profit` | Revenue minus cost (already exists) | **HIGH** |
| Stock Status | Hali ya Stoo | `stoo`, `hesabu`, `stock baki` | CatalogItem + balances (already exists) | **HIGH** |
| Low Stock | Bidhaa Zinaisha | `zinaisha`, `low stock`, `imeisha` | balance ≤ reorderPoint | **HIGH** |
| Monthly Expenses | Gharama za Mwezi | `gharama`, `matumizi` | Expense groupBy category | **MEDIUM** |

### Kundi C — Ripoti za Mikopo na Wateja (Credit & Customers)

| Jina | Swahili | Keywords | Data Source | Priority |
|------|---------|----------|-------------|----------|
| Customer Debt | Deni la Wateja | `deni`, `wanadaiwa`, `debtors` | CustomerCredit overdue | **HIGH** |
| Top Customers | Wateja Bora | `wateja bora`, `best customer` | Sale groupBy customer, sum total | **MEDIUM** |
| Credit Report | Ripoti ya Mikopo | `mkopo`, `credit` | CustomerCredit status (active/overdue/paid) | **MEDIUM** |
| Supplier Debt | Deni kwa Wasambazaji | `deni la supplier`, `supplier debt` | Purchase unpaid balance | **MEDIUM** |

### Kundi D — Ripoti za Tawi na Wafanyakazi (Branches & Staff)

| Jina | Swahili | Keywords | Data Source | Priority |
|------|---------|----------|-------------|----------|
| Branch Sales | Mauzo kwa Tawi | `tawi`, `branch`, `location` | Sale groupBy branchId | **LOW** |
| Staff Sales | Mauzo kwa Staff | `staff sales`, `salesperson` | Sale groupBy staffId | **LOW** |
| Commission | Tume za Mauzo | `tume`, `commission` | CommissionLedger | **LOW** |

### Kundi E — Ripoti za Aina ya Biashara (Industry-Specific)

| Industry | Report | Keywords | Data Source | Priority |
|----------|--------|----------|-------------|----------|
| Restaurant | Mauzo kwa Meza | `meza`, `table`, `oda` | SaleItem groupBy menu item | **LOW** |
| Restaurant | Menyu Maarufu | `menyu`, `popular dish` | SaleItem groupBy product | **LOW** |
| Pharmacy | Dawa Zinazoisha | `dawa`, `expiry`, `medicine` | CatalogItem with expiry | **MEDIUM** |
| Pharmacy | Prescription Stats | `prescription`, `dawa` | Sale with prescription flag | **LOW** |
| Wholesale | Mauzo kwa Jumla | `jumla`, `wholesale` | Sale where customerType=WHOLESALE | **LOW** |
| Wholesale | Katoni/Boksi Report | `katoni`, `boksi`, `gunia` | SaleItem groupBy unit | **LOW** |
| Hardware | Stock kwa Kategoria | `mbao`, `saruji`, `rangi` | CatalogItem groupBy category | **LOW** |

---

## Mfano wa Matokeo (Output Examples)

### Leo (sasa):
> *"Ripoti ya mauzo (siku 30): 120 mauzo, jumla TZS 5,000,000."*

### Baadaye:
> *"Boss, mauzo ya leo ni laki saba na elfu hamsini. Bidhaa iliyouza zaidi ni maji makubwa (120,000 TZS). Wateja wanaodaiwa jumla ya laki tatu. Nikupe maelezo zaidi?"*

### Mfano mwingine:
> *"Boss, stoo inaisha! Bidhaa 3 ziko chini ya reorder point: maji makubwa (10 baki), mchele (5 baki), mafuta (2 baki). Nisaidie kuongeza order?"*

### Deni:
> *"Wateja 5 wana deni la jumla ya TZS 450,000. Mteja anayedaiwa zaidi ni Juma (150,000 TZS, siku 35 imepita)."*

---

## Implementation Order

1. **Kundi A** — Daily basics (files: `tool-registry.ts`, `command-parser.ts` kwa synonyms)
2. **Kundi B** — Period reports (files: `tool-registry.ts`, `business-brain.ts`)
3. **Kundi C** — Credit reports (files: `tool-registry.ts`, `assistant/types.ts`)
4. **Kundi D** — Branch/Staff reports (files: `tool-registry.ts`)
5. **Kundi E** — Industry-specific (files: `business-vocabulary.ts`, `tool-registry.ts`)

---

## Current Report Tool Code (for reference)

Current `view-report` handler in `tool-registry.ts` (line 944-1030):

```typescript
handler: async (params) => {
  const type = params.type as string;
  const businessId = params.businessId as string;
  const days = (params.days as number) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  switch (type) {
    case "sales":
    case "mauzo": {
      const sales = await prisma.sale.findMany({
        where: { businessId, createdAt: { gte: startDate } },
      });
      const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
      return {
        success: true,
        message: `Ripoti ya mauzo (siku ${days}): ${sales.length} mauzo, jumla ${formatCurrency(totalRevenue)}.`,
        data: { count: sales.length, total: totalRevenue, period: days },
      };
    }
    // ... profit, stock, expenses, staff
  }
}
```

**Bug**: `sale.total` haipo — sahihi ni `sale.grandTotal`.
