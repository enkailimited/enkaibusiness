# Enkai Business Platform — System Overview

_A complete guide from registration to daily operations_

---

## 1. Getting Started: Registration & Login

### Creating an Account
A new user visits the registration page and fills in a simple 3-step form:
1. **Personal details** — full name and email address
2. **Security** — phone number, username, and password
3. **Terms** — review and agree to the terms

Once submitted, the system creates the user's account and immediately sets up a personal **workspace** — a private space where the user will manage everything. The user is then taken to their workspace dashboard.

### Logging In
Returning users can log in using their email, phone number, or username. If it is the user's first login after being forced to reset their password, the system will ask them to create a new password before proceeding.

---

## 2. The Workspace

A **workspace** is the user's home base. From here, they can:

- Create and manage one or more **businesses**
- View dashboard statistics
- Manage workspace members (add other users as team members)
- Update their profile and workspace settings

### Workspace Members
The user who creates the workspace is the **Owner**. They can invite other people and give them roles such as **Admin**, **Member**, or **Guest**, each with different levels of access.

---

## 3. Creating a Business

### Step 1: Choose a Plan
Before creating a business, the user must select a **subscription plan**. Plans define how much the business pays per day, week, month, or year. The platform offers various plans to suit different needs.

### Step 2: Business Details
The user fills in business information:
- Business name and a web-friendly address (slug)
- Contact details (email, phone, address)
- Tax ID (if applicable)
- Currency and timezone
- **Industry** — what type of business (Retail, Healthcare, Restaurant, Manufacturing, Agriculture, or Services)
- **Business mode** — whether they sell Retail, Wholesale, or Both

### Step 3: Business Size & Add-ons
The user selects the business size (Small, Medium, or Large), which affects the daily subscription price. They can also opt-in for **QR code stickers** for digital menu ordering.

### Step 4: Setup is Complete
The system calculates:
- A **daily price** based on the plan and business size
- A **one-time setup fee** based on the business mode and any QR stickers ordered

The business is created, the user is automatically assigned as the **Owner**, a **subscription** is started, and a **wallet** is created with the setup fee as the initial balance. The owner can now access the business dashboard and start setting up operations.

---

## 4. Business Dashboard

Each business has its own dashboard showing key information:
- Number of branches and stores
- Staff count
- Customer count
- Quick actions to manage categories, brands, and units

From the sidebar, the owner can access every part of the business.

---

## 5. Setting Up the Business

### Branches & Stores
A business can have one or more **branches** (physical locations like shops or offices). Each branch can have multiple **stores** (sub-locations within a branch, such as different departments or sections).

### Staff Management
The owner can add **staff members** to the business. Each staff member is linked to a user account and can be assigned to specific branches or stores with a particular role and position.

### Roles & Permissions
The system comes with a flexible role system. Roles can be set at the platform level or the business level. Each role has a set of **permissions** that control what the user can see and do (e.g., view sales, create products, manage staff).

---

## 6. Catalog Management

Before selling anything, the business needs to set up its **catalog** — the list of everything they sell.

### Categories
Items can be organized into **categories** (e.g., Beverages, Electronics, Vegetables). Categories can have sub-categories (a parent-child structure).

### Brands
If the business sells branded products, they can create a **brand list** (e.g., Coca-Cola, Samsung, Toyota).

### Units of Measure
Products are sold in different **units** — pieces, kilograms, liters, meters, etc. The business can define their own units and even set up **conversions** between them (e.g., 1 box = 12 pieces).

### Products & Services
The actual items for sale are called **catalog items**. Each item has:
- Name, description, and SKU/barcode
- Type (Product, Service, Medicine, Menu Item, etc.)
- Category, brand, and unit
- Selling price and cost price
- Tax rate
- Whether stock tracking is needed
- An image

Items can also have **variants** (e.g., a T-shirt in Small, Medium, Large sizes, each with its own SKU and price).

### Price Lists
Businesses can create different **price lists** for different customer types — for example, a retail price list for walk-in customers and a wholesale price list with lower prices for bulk buyers.

---

## 7. Customers & Suppliers

### Customers
The business can register customers with their contact details. Customers can be:
- **Retail** — regular walk-in buyers
- **Wholesale** — bulk buyers
- **Walk-in** — anonymous one-time customers

Customers can be grouped (e.g., "VIP Customers") with special discount percentages.

### Suppliers
**Suppliers** are the people or companies the business buys from. Each supplier record stores contact details, payment terms, and currency preferences.

---

## 8. Sales & Point of Sale (POS)

### Making a Sale
Staff can record **sales** at the counter (or through the system). Each sale:
- Selects the customer (or marks as walk-in)
- Adds items from the catalog
- Calculates subtotals, discounts, taxes, and the grand total
- Records which staff member made the sale
- Specifies the branch and store

Sales can have different **pricing tiers** — retail price, wholesale price, promotional price, etc.

### Invoices
After a sale, the business can generate an **invoice**. Invoices track:
- How much was paid and how much is still owed
- Due dates
- Status (draft, sent, paid, partial, overdue, cancelled)

### Quotations
Before a sale, the business can create a **quotation** for a customer. This is a formal price quote that can be sent to the customer. Once accepted, it can be converted into a sale. Quotations have expiry dates.

### Returns
If a customer returns an item, the business can process a **return** linked to the original sale. Returns track the reason, condition of items, and refund amount.

---

## 9. Purchasing & Inventory

### Buying from Suppliers
When the business needs to restock, they can:
1. Create a **purchase order** — a request to buy items from a supplier
2. Send it to the supplier (draft → sent → approved)
3. When goods arrive, record a **goods received note** to confirm what came in
4. Convert the purchase order into an actual **purchase** transaction

### Inventory Management
The system tracks stock across **inventory locations** (which can be at the business, branch, or store level). For each product, it records:
- Quantity on hand
- Available quantity (what can be sold)
- Committed quantity (reserved for existing orders)
- Reorder points and maximum stock levels
- Batch numbers and expiry dates (useful for perishable goods)

When a sale is made, stock is automatically reduced. When a purchase is received, stock increases. The system also handles **stock adjustments** (correcting counts after a physical count) and **stock transfers** (moving items between branches or stores).

---

## 10. Expenses

The business can track **expenses** — anything they spend money on. Expenses are organized by **category** (e.g., Rent, Utilities, Salaries, Marketing). Each expense records:
- Amount and date
- Who it was paid to
- A receipt or reference
- Status (draft, approved, paid)

---

## 11. Subscriptions & Wallet

### How Subscription Works
Every business pays a **daily subscription fee** to use the platform. The fee depends on:
- The selected subscription plan
- The business size (small, medium, large)
- Whether QR ordering is enabled

### The Wallet
Each business has a **wallet** that stores prepaid funds. The daily subscription fee is automatically deducted from the wallet balance. When the balance runs low, the owner can request a **deposit** (adding more funds). Platform administrators can approve or reject deposit requests.

### Grace Period & Suspension
If the wallet runs out of funds, the business enters a **grace period** (additional days to add funds). If no deposit is made, the subscription becomes **suspended** and the business cannot operate until funds are added.

### QR Ordering Toggle
The owner can enable or disable **QR ordering** at any time. Enabling it adds a small extra daily fee and a one-time QR sticker printing fee to the wallet.

---

## 12. QR Ordering (Digital Menu)

### What is QR Ordering?
QR ordering allows customers to scan a **QR code** at the business location and view a digital menu on their phone. They can browse items, see prices, and photos — all without needing an app.

### How it Works
1. The platform administrator creates a **distribution campaign** — a batch of QR codes to be printed and distributed.
2. QR codes are generated and assigned to businesses.
3. The business owner installs the QR code stickers at tables or counters.
4. The owner selects which catalog items appear on each QR code's menu and sets custom prices if needed.
5. When a customer scans the QR code with their phone camera, they see the **public menu page** — a clean, mobile-friendly display of the business name, items, descriptions, and prices.

### For Platform Administrators
The platform team can manage QR code distribution campaigns, track which codes are assigned, installed, active, or damaged.

---

## 13. Sales Network (Team)

### What is the Sales Network?
The platform includes a **sales team system** for businesses that want to grow through a network of sales agents. There are four levels in the hierarchy:
1. **National Sales Manager** — top level, oversees the whole network
2. **Region Manager** — manages a geographic region
3. **Team Leader** — leads a small team of agents
4. **Freelancer** — independent agent on the ground

### Leads
Sales team members find potential customers and record them as **leads**. A lead goes through a pipeline:
- New → Contacted → Interested → Demo → Negotiation → Converted → Lost

### Converting a Lead to a Customer
When a lead is ready to buy, a sales team member can **register them as a business**. This:
1. Creates a workspace for the lead (they become the Owner)
2. Creates their business with the chosen plan
3. Sets up their subscription and wallet

### Commissions
The platform can track **commissions** earned by sales team members. Rules define how much each hierarchy level earns (a flat fee or a percentage). Earnings are recorded in a commission ledger and can be paid out in batches.

### Team Management
Higher-level members can invite and manage lower-level members. They can see their team tree, track targets and achievements, and monitor performance.

---

## 14. Support Tickets

If a business owner or user needs help, they can create a **support ticket**. Tickets have:
- A title and description of the issue
- Priority level (Low, Medium, High, Urgent)
- Status (Open, In Progress, Resolved, Closed)

Platform support staff can view all tickets, update their status, and assign them to specific team members.

---

## 15. Notifications & Communications

### In-App Notifications
Users receive notifications within the platform for events like new sales, payments, subscription changes, and more.

### Email Communications
Businesses can configure **email settings** (SMTP) to send emails directly from the system. They can create **email templates** with placeholders for personalized content. The platform also supports **email campaigns** — sending bulk emails to customer segments with tracking for opens and clicks.

---

## 16. AI Assistant (Firdaus)

The platform includes an AI assistant called **Firdaus** that helps users through complex tasks. It can:
- Guide business setup step by step
- Help with sales and purchasing workflows
- Remember business preferences (favorite suppliers, top customers, popular products)

Firdaus uses **workflows** — multi-step processes that the AI walks the user through — and **business memory** to learn and adapt to each business's unique patterns.

---

## 17. Cash Management

The system includes **cash register** management for businesses that handle physical cash. Each register tracks:
- Opening and closing balances
- Cash transactions (money in, money out, transfers)
- POS sessions (daily shift tracking with opening/closing floats)

---

## 18. Customer Credit

For wholesale businesses, the system supports **customer credit accounts**:
- Each customer can have a credit limit
- Sales can be made on credit (increasing the balance)
- Payments reduce the balance
- The system tracks the full history of credit transactions

---

## 19. Reports & Analytics

The platform provides various reports for business owners and platform administrators to understand performance, sales trends, expenses, and more.

---

## Summary: A Typical Day

Here is how a typical business owner might use the platform in a day:

1. **Login** — access the workspace dashboard
2. **Select a business** — choose which of their businesses to manage
3. **Check dashboard** — see today's sales, stock alerts, and upcoming subscriptions
4. **Process sales** — record customer purchases at the counter
5. **Check inventory** — see if any items need reordering
6. **Create a purchase order** — order stock from a supplier
7. **Add a new product** — expand the catalog with a new item
8. **Review expenses** — log a daily expense
9. **Check wallet balance** — ensure enough funds are available for subscription
10. **View reports** — see how the business is performing

Meanwhile, behind the scenes, the platform is:
- Deducting the daily subscription fee from the wallet
- Updating stock levels after each sale
- Sending notifications for important events
- Tracking all activities for audit purposes

---

_This document provides a high-level overview of the Enkai Business Platform. Each feature area has its own detailed documentation for users who need step-by-step guidance._
