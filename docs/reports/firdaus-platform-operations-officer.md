# Firdaus Platform Operations Officer — Architecture & Implementation Plan

> **Date:** 2026-06-12
> **Status:** Planning / Pre-Implementation
> **Version:** V8 Phase 2 (Platform Operations Coverage)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Platform Domains Analysis](#3-platform-domains-analysis)
4. [Platform Language Pack](#4-platform-language-pack)
5. [Platform Command Library](#5-platform-command-library)
6. [Sales Team Assistant Capabilities](#6-sales-team-assistant-capabilities)
7. [Permission System Overhaul](#7-permission-system-overhaul)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Coverage Matrix](#9-coverage-matrix)

---

## 1. Executive Summary

Firdaus currently operates in two modes: **workspace mode** (full business operations via 20 tools, 26 intents, workflow engine) and **platform mode** (read-only aggregate queries via `handlePlatformRequest()` with no permissions and no mutations).

**The gap is extreme:** Platform mode supports only 6 text-triggered aggregate queries (users, businesses, subscriptions, leads, workspaces, sales counts). Zero mutations, zero permission checks, zero workflow support, zero sales-team-specific features.

**Goal:** Achieve 100% Platform Operation Coverage — every action available in the Platform UI must be executable by Firdaus via voice or chat, subject to proper permission checks.

**Current Coverage:**
| Domain | Operations | Covered by Firdaus | Coverage |
|--------|-----------|-------------------|----------|
| Users | 10 | 0 (read-only count) | 10% |
| Workspaces | 6 | 0 (read-only count) | 8% |
| Businesses | 6 | 0 (read-only count) | 8% |
| Subscriptions | 7 | 0 (read-only count) | 8% |
| Leads | 9 | 0 (read-only count) | 6% |
| Commissions | 3 | 0 | 0% |
| Sales Network | 4 | 0 | 0% |
| Support | 5 | 0 | 0% |
| Marketing | 3 | 0 | 0% |
| Distribution | 3 | 0 | 0% |
| Finance | 3 | 0 | 0% |
| **Total** | **59** | **0 (6 read-only)** | **~5%** |

---

## 2. Current State Analysis

### 2.1 What Firdaus Currently Does in Platform Mode

**File:** `src/features/enkai/brain/business-brain.ts`, function `handlePlatformRequest()` (lines 423–502)

The function matches text against 6 regex patterns:

| Trigger | Query | Action |
|---------|-------|--------|
| `watumiaji\|users?` | `user.count()` + `findMany` | Returns count + names |
| `biashara\|businesses?` | `business.count()` | Returns count |
| `subscription\|usajili\|plan` | `subscription.count()` by status | Returns ACTIVE/EXPIRED/CANCELLED counts |
| `leads?\|wateja watarajiwa` | `lead.count()` by status | Returns NEW/CONTACTED/CONVERTED counts |
| `workspace\|kazi` | `workspace.count()` | Returns count |
| `mauzo\|sales?\|income` | `sale.count()` + `sale.aggregate` | Returns count + grandTotal |

**Missing entirely:** All mutations, all role-based access, all sales-team workflows, all multi-step operations.

### 2.2 Current Firdaus Architecture (Platform-Relevant)

| Component | File | Platform Relevance |
|-----------|------|--------------------|
| `processWithBrain()` | `business-brain.ts:49` | Routes to `handlePlatformRequest()` when `mode === "platform"` |
| `handlePlatformRequest()` | `business-brain.ts:423` | Read-only aggregations, no permissions, static help fallback |
| `checkPermission()` | `permission-service.ts:11` | Staff-only — fails for platform users (no Staff record) |
| `command-parser.ts` | `commands/command-parser.ts` | 17 slash + 21 NLU patterns — all workspace-specific |
| `tool-registry.ts` | `tools/tool-registry.ts` | 20 tools — all workspace/business-scoped |
| `assistant-service.ts` | `assistant/assistant-service.ts` | 16 handlers — all workspace/business-scoped |
| `memory-service.ts` | `brain/memory-service.ts` | Business-memory only — no platform memory |
| `firdaus-global-listener.tsx` | `components/firdaus-global-listener.tsx` | Detects mode from pathname `/platform/*` |

### 2.3 Available Server Actions (Unexploited by Firdaus)

Firdaus could call **46 feature modules' server actions** — but currently uses exactly **zero** platform mutations. Key available actions:

| Module | Available Actions | Firdaus Uses |
|--------|------------------|-------------|
| `users` | 8 actions (invite, activate, deactivate, delete, list, profile, permissions) | 0 |
| `workspaces` | 8 actions (create, update, delete, addMember, updateMemberRole, removeMember) | 0 |
| `businesses` | 6 actions (create, update, delete, get, list) | 0 |
| `subscriptions` | 15 actions (createPlan, subscribe, cancel, renew, updateStatus, recordPayment, metrics) | 0 |
| `leads` | 11 actions (create, update, assign, transfer, convert, addActivity, metrics) | 0 |
| `commissions` | 13 actions (createRule, updateRule, approveEntry, createPayout, metrics) | 0 |
| `sales-network` | 11 actions (createHierarchy, createProfile, getTeamTree, getFreelancers) | 0 |
| `support` | 11 actions (create, assign, resolve, close, reopen, metrics) | 0 |
| `roles/rbac` | 14 actions (createRole, assignPermission, assignRoleToUser, platform roles) | 0 |
| `platform` | 5 actions (stats, recent activity, users, settings) | 0 |

---

## 3. Platform Domains Analysis

### 3.1 Users Domain

**Current Firdaus capability:** Count users only (via `handlePlatformRequest`)

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Create user | Not directly (uses auth) | — | No |
| Invite user | `inviteUserWithStaffAction()` | `hasPermission("users.create")` | No |
| Deactivate user | `deactivateUserAction()` | `hasPermission("users.update")` | No |
| Activate user | `activateUserAction()` | `hasPermission("users.update")` | No |
| Assign role | `assignRoleToUserAction()` | `requireAuth()` | No |
| Remove role | `removeRoleFromUserAction()` | `requireAuth()` | No |
| Reset password | Via auth API | — | No |
| Search users | `listUsersAction()` | `requireAuth()` | No |
| List users | `listPlatformUsers()` (platform) | None | Count only (no list) |

**Required Tables:** `User`, `UserInvite`, `UserRole`, `Role`, `Session`, `Account`

### 3.2 Workspaces Domain

**Current Firdaus capability:** Count workspaces only

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Create workspace | `createWorkspaceAction()` | `requireAuth()` | No |
| Update workspace | `updateWorkspaceAction()` | `requireAuth()` | No |
| Archive/Delete workspace | `deleteWorkspaceAction()` | `requireAuth()` | No |
| Invite member | `addMemberAction()` | `requireAuth()` | No |
| Update member role | `updateMemberRoleAction()` | `requireAuth()` | No |
| Remove member | `removeMemberAction()` | `requireAuth()` | No |
| List workspaces | `getUserWorkspacesAction()` | `requireAuth()` | Count only |

**Required Tables:** `Workspace`, `WorkspaceMember`, `User`

### 3.3 Businesses Domain

**Current Firdaus capability:** Count businesses only

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Create business | `createBusinessAction()` | `requireAuth()` | No |
| Update business | `updateBusinessAction()` | `requireAuth()` | No |
| Activate/suspend business | Via `updateBusinessAction` (isActive) | — | No |
| Search businesses | `getBusinessAction()`, `getWorkspaceBusinessesAction()` | `requireAuth()` | No |
| List businesses | `getBusinessesAction()` | `requireAuth()` | Count only |
| Delete business | `deleteBusinessAction()` | `requireAuth()` | No |
| View business modes | Via `BusinessMode` table | — | No |

**Required Tables:** `Business`, `BusinessMode`, `WorkspaceMember`

### 3.4 Subscriptions Domain

**Current Firdaus capability:** Count subscriptions by status (ACTIVE, EXPIRED, CANCELLED)

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| View subscriptions | `listSubscriptionsAction()` | `requireAuth()` | Count by status |
| Activate subscription | `updateSubscriptionStatusAction()` | `requireAuth()` | No |
| Suspend subscription | `updateSubscriptionStatusAction()` | `requireAuth()` | No |
| Renew subscription | `renewSubscriptionAction()` | `requireAuth()` | No |
| Upgrade/downgrade plan | `subscribeAction()` (new sub) | `requireAuth()` | No |
| Create plan | `createPlanAction()` | `requireAuth()` | No |
| Record payment | `recordPaymentAction()` | `requireAuth()` | No |

**Required Tables:** `Subscription`, `SubscriptionPlan`, `SubscriptionPayment`, `SubscriptionWallet`, `SubscriptionTransaction`

### 3.5 Leads Domain

**Current Firdaus capability:** Count leads by status (NEW, CONTACTED, CONVERTED)

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Create lead | `createLeadAction()` | `requireAuth()` | No |
| Update lead | `updateLeadAction()` | `requireAuth()` | No |
| Assign lead | `assignLeadAction()` | `requireAuth()` | No |
| Transfer lead | `transferLeadAction()` | `requireAuth()` | No |
| Update lead status | `updateLeadStatusAction()` | `requireAuth()` | No |
| Convert lead | `convertLeadAction()` | `requireAuth()` | No |
| Add lead activity | `addLeadActivityAction()` | `requireAuth()` | No |
| Schedule followup | Via `addLeadActivityAction()` | — | No |
| List leads by filters | `getLeadsAction()` | `requireAuth()` | Count only |
| Get lead metrics | `getLeadMetricsAction()` | `requireAuth()` | No |

**Required Tables:** `Lead`, `LeadActivity`, `LeadAssignment`, `SalesProfile`, `User`

### 3.6 Commissions Domain

**Current Firdaus capability:** None

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Calculate commission | `createCommissionRuleAction()` | `requireAuth()` | No |
| View commission ledger | `getCommissionEntriesAction()` | `requireAuth()` | No |
| Approve commission entry | `approveCommissionEntryAction()` | `requireAuth()` | No |
| Generate payout summary | `createPayoutAction()`, `getPayoutsAction()` | `requireAuth()` | No |
| View pending payouts | `getPendingPayoutsAction()` | `requireAuth()` | No |
| View commission metrics | `getCommissionMetricsAction()` | `requireAuth()` | No |

**Required Tables:** `CommissionRule`, `CommissionLedger`, `CommissionPayout`, `SalesHierarchy`, `SalesProfile`

### 3.7 Sales Network Domain

**Current Firdaus capability:** None

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Create hierarchy level | `createHierarchyLevelAction()` | `requireAuth()` | No |
| Create sales profile | `createProfileAction()` | `requireAuth()` | No |
| View team tree | `getTeamTreeAction()` | `requireAuth()` | No |
| View freelancers | `getFreelancersAction()` | `requireAuth()` | No |
| List profiles | `listProfilesAction()` | `requireAuth()` | No |

**Required Tables:** `SalesHierarchy`, `SalesProfile`, `User`

### 3.8 Support Domain

**Current Firdaus capability:** None

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Create ticket | `createTicketAction()` | `requireAuth()` | No |
| Update ticket | `updateTicketAction()` | `requireAuth()` | No |
| Assign ticket | `assignTicketAction()` | `requireAuth()` | No |
| Resolve ticket | `resolveTicketAction()` | `requireAuth()` | No |
| Close ticket | `closeTicketAction()` | `requireAuth()` | No |
| Reopen ticket | `reopenTicketAction()` | `requireAuth()` | No |
| List tickets | `listTicketsAction()` | `requireAuth()` | No |
| Get ticket metrics | `getTicketMetricsAction()` | `requireAuth()` | No |

**Required Tables:** `SupportTicket`, `User`

### 3.9 Marketing Domain

**Current Firdaus capability:** None

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| Create campaign | `createCampaignAction()` | `requireAuth()` | No |
| Launch campaign | `launchCampaignAction()` | `requireAuth()` | No |
| Complete/cancel campaign | `completeCampaignAction()`, `cancelCampaignAction()` | `requireAuth()` | No |
| View campaign metrics | `getCampaignMetricsAction()` | `requireAuth()` | No |
| List campaigns | `listCampaignsAction()` | `requireAuth()` | No |

**Required Tables:** `DistributionCampaign`, `QRCode`, `Campaign`, `CampaignSegment`, `CampaignRecipient`, `EmailTemplate`, `EmailLog`

### 3.10 Finance Domain

**Current Firdaus capability:** `check-wallet` tool exists (business-scoped only). No platform-level finance.

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| View wallet (business) | `check-wallet` tool | None | Yes (workspace) |
| View wallet (platform) | — | — | No |
| Adjust wallet | `SubscriptionWallet` update | — | No |
| View transactions | `getPaymentsAction()` | `requireAuth()` | No |
| View revenue metrics | `getRevenueMetricsAction()` (legacy) | `requireAuth()` | Platform aggregate only |

**Required Tables:** `SubscriptionWallet`, `SubscriptionTransaction`, `Payment`, `SubscriptionPayment`

### 3.11 Platform Settings & Config

**Current Firdaus capability:** None

| Operation | Server Action Exists | Permission Check | Firdaus Can Do |
|-----------|--------------------|-----------------|----------------|
| View platform settings | `getPlatformSettingAction()` | `requireAuth()` | No |
| Update platform settings | `savePlatformSettingsAction()` | `requireAuth()` | No |
| Create permission | `createPermissionAction()` | `requireAuth()` | No |
| Create role | `createRoleAction()` | `requireAuth()` | No |
| Assign permission to role | `assignPermissionToRoleAction()` | `requireAuth()` | No |

**Required Tables:** `Setting`, `Permission`, `Role`, `RolePermission`

---

## 4. Platform Language Pack

### 4.1 Core Platform Terms — Swahili / English

| English | Swahili | Used In |
|---------|---------|---------|
| platform | jukwaa, mfumo | All domains |
| user | mtumiaji, watumiaji (pl) | Users |
| admin | msimamizi | Users, Roles |
| super admin | msimamizi mkuu | Users, Roles |
| sales team | timu ya mauzo | Sales Network |
| lead | mtarajiwa, wateja watarajiwa (pl) | Leads |
| prospect | mteja mtarajiwa | Leads |
| opportunity | fursa | Leads |
| pipeline | bomba la mauzo, msururu | Leads |
| followup | ufuatiliaji, kufuatilia | Leads |
| demo | onyesho, demo | Leads |
| negotiation | mazungumzo, majadiliano | Leads |
| conversion | ubadilishaji, kubadilisha | Leads, General |
| subscription | usajili, kujiandikisha | Subscriptions |
| renewal | upya, kusasisha | Subscriptions |
| upgrade | kuboresha, kuongeza | Subscriptions |
| downgrade | kupunguza | Subscriptions |
| plan | mpango | Subscriptions |
| wallet | mkoba, pochi | Finance |
| balance | salio | Finance |
| transaction | muamala | Finance |
| payment | malipo | Finance |
| commission | tume, kamisheni | Commissions |
| payout | malipo ya tume | Commissions |
| territory | eneo, kanda | Distribution |
| freelancer | mfanyakazi huru | Sales Network |
| team leader | kiongozi wa timu | Sales Network |
| regional manager | meneja wa kanda | Sales Network |
| national manager | meneja wa taifa | Sales Network |
| workspace | eneo la kazi | Workspaces |
| business owner | mmiliki wa biashara | Businesses |
| trial | jaribio, majaribio | Subscriptions |
| active customer | mteja anayetumia | Subscriptions |
| expired customer | mteja muda wake umekwisha | Subscriptions |
| campaign | kampeni, tangazo | Marketing |
| ticket | tiketi | Support |
| support case | kesi ya usaidizi | Support |
| branch | tawi | Businesses |
| store | duka | Businesses |
| staff | wafanyakazi | Staff |
| permission | ruhusa | Roles/Permissions |
| role | jukumu, wadhifa | Roles |
| quota | mgao | Sales Network |
| target | lengo | Sales Network |
| performance | utendaji | All domains |
| insight | maarifa | Insights |
| report | ripoti | Reports |
| summary | muhtasari | All domains |
| reminder | ukumbusho | Leads |
| notification | arifa, taarifa | Notifications |

### 4.2 Lead Status Vocabulary

| Lead Status | Swahili | Variations |
|------------|---------|------------|
| NEW | mpya | lead mpya, wateja wapya |
| CONTACTED | kuwasiliana | wamewasiliana, wamepigwa simu |
| INTERESTED | wamevutiwa | wana nia, wameonesha hamu |
| DEMO | demo | onyesho, wameoneshwa |
| NEGOTIATION | mazungumzo | wanajadili, wanazungumza bei |
| CONVERTED | wamebadilishwa | wamekuwa wateja, wamesajiliwa |
| LOST | wamepotea | hawajafanikiwa, wamekataa |

### 4.3 Subscription Status Vocabulary

| Status | Swahili | Variations |
|--------|---------|------------|
| ACTIVE | inatumika | inaendelea, hai |
| GRACE_PERIOD | muda wa rehema | vipindi vya subira |
| SUSPENDED | imesimamishwa | imezuiliwa |
| EXPIRED | imekwisha | muda wake umekwisha |
| CANCELLED | imefutwa | imeachishwa |

### 4.4 Platform Action Verbs

| English Verb | Swahili | Example |
|-------------|---------|---------|
| create | unda, tengeneza, ongeza | unda mtumiaji |
| update | sasisha, badilisha | sasisha biashara |
| delete | futa | futa workspace |
| activate | washa, wezesha | washa subscription |
| deactivate | zima, simamisha | zima mtumiaji |
| suspend | simamisha | simamisha usajili |
| assign | weka, gawa | weka lead kwa John |
| transfer | hamisha | hamisha lead |
| convert | badilisha | badilisha lead kuwa mteja |
| list | orodhesha, nipe | orodhesha watumiaji |
| search | tafuta | tafuta biashara |
| count | hesabu, hesabia | hesabu leads |
| view | angalia, onyesha | angalia wallet |
| invite | alika | alika mtumiaji |
| approve | idhinisha | idhinisha tume |
| schedule | panga, weka | weka followup |
| remind | kumbusha | nikumbushe |
| generate | tengeneza | tengeneza ripoti |

---

## 5. Platform Command Library

### 5.1 Users Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `user-invite` | "alika mtumiaji mpya", "invite user test@email.com", "mtumiaji mpya kwa ajili ya biashara" | users.create | `inviteUserWithStaffAction()` | `UserInvite`, `User`, `Staff` |
| `user-deactivate` | "zima mtumiaji [name]", "deactivate user [id]", "simamisha akaunti ya [name]" | users.update | `deactivateUserAction()` | `User` |
| `user-activate` | "washa mtumiaji [name]", "activate user [id]", "wezesha akaunti ya [name]" | users.update | `activateUserAction()` | `User` |
| `user-assign-role` | "weka jukumu la [role] kwa [user]", "assign [role] role to [user]", "mpe [user] jukumu la [role]" | roles.assign | `assignRoleToUserAction()` | `UserRole`, `Role`, `User` |
| `user-remove-role` | "ondoa jukumu la [role] kwa [user]", "remove [role] from [user]" | roles.assign | `removeRoleFromUserAction()` | `UserRole`, `Role`, `User` |
| `user-list` | "orodhesha watumiaji", "list users", "nipe watumiaji wote", "watumiaji wa platform" | users.view | `listPlatformUsers()` | `User`, `UserRole` |
| `user-search` | "tafuta mtumiaji [name]", "search user [email]", "tafuta [name] kwa watumiaji" | users.view | `listUsersAction()` | `User` |
| `user-profile` | "angalia profile ya [user]", "view profile of [user]" | users.view | `getProfileAction()` | `User` |

### 5.2 Workspaces Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `workspace-create` | "unda workspace mpya [name]", "create workspace [name]", "tengeneza eneo jipya la kazi" | workspaces.create | `createWorkspaceAction()` | `Workspace`, `WorkspaceMember` |
| `workspace-update` | "sasisha workspace [name]", "update workspace [id]", "badilisha jina la workspace" | workspaces.update | `updateWorkspaceAction()` | `Workspace` |
| `workspace-archive` | "futa workspace [name]", "archive workspace [id]", "maliza workspace" | workspaces.delete | `deleteWorkspaceAction()` | `Workspace` |
| `workspace-invite-member` | "alika [user] kwa workspace", "invite [email] to workspace", "ongeza mwanachama kwenye workspace" | workspaces.manage | `addMemberAction()` | `WorkspaceMember` |
| `workspace-remove-member` | "ondoa [user] kwenye workspace", "remove [user] from workspace" | workspaces.manage | `removeMemberAction()` | `WorkspaceMember` |
| `workspace-list` | "orodhesha workspaces", "list workspaces", "nipe workspaces zangu" | workspaces.view | `getUserWorkspacesAction()` | `Workspace`, `WorkspaceMember` |

### 5.3 Businesses Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `business-create` | "unda biashara mpya [name]", "create business [name]", "sajili biashara [name] kwenye workspace" | businesses.create | `createBusinessAction()` | `Business`, `BusinessMode` |
| `business-update` | "sasisha biashara [name]", "update business [id]", "badilisha taarifa za biashara" | businesses.update | `updateBusinessAction()` | `Business`, `BusinessMode` |
| `business-activate` | "washa biashara [name]", "activate business [id]", "wezesha biashara" | businesses.update | `updateBusinessAction({isActive: true})` | `Business` |
| `business-suspend` | "simamisha biashara [name]", "suspend business [id]", "zima biashara kwa muda" | businesses.update | `updateBusinessAction({isActive: false})` | `Business` |
| `business-search` | "tafuta biashara [name]", "search business [query]", "tafuta biashara kwa jina" | businesses.view | `getBusinessAction()` | `Business` |
| `business-list` | "orodhesha biashara", "list businesses", "nipe biashara zote" | businesses.view | `getBusinessesAction()` | `Business`, `WorkspaceMember` |

### 5.4 Subscriptions Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `subscription-view` | "angalia usajili wa [business]", "view subscription of [business]", "subscription status ya [business]" | subscriptions.view | `getSubscriptionAction()` | `Subscription`, `SubscriptionPlan`, `Business` |
| `subscription-list` | "orodhesha usajili wote", "list subscriptions", "nipe subscriptions zote" | subscriptions.view | `listSubscriptionsAction()` | `Subscription`, `SubscriptionPlan` |
| `subscription-activate` | "washa usajili wa [business]", "activate subscription for [business]" | subscriptions.manage | `updateSubscriptionStatusAction()` | `Subscription` |
| `subscription-suspend` | "simamisha usajili wa [business]", "suspend subscription for [business]" | subscriptions.manage | `updateSubscriptionStatusAction()` | `Subscription` |
| `subscription-renew` | "sasisha usajili wa [business]", "renew subscription for [business]" | subscriptions.manage | `renewSubscriptionAction()` | `Subscription` |
| `subscription-upgrade` | "boresha mpango wa [business] kwenda [plan]", "upgrade [business] to [plan]" | subscriptions.manage | `subscribeAction()` + cancel old | `Subscription`, `SubscriptionPlan` |
| `subscription-downgrade` | "punguza mpango wa [business] kwenda [plan]", "downgrade [business] to [plan]" | subscriptions.manage | `subscribeAction()` + cancel old | `Subscription`, `SubscriptionPlan` |
| `subscription-expiring` | "nipe biashara ambazo subscription zinaisha wiki hii", "expiring subscriptions this week" | subscriptions.view | `checkExpiringSubscriptionsAction()` | `Subscription` |
| `subscription-metrics` | "takwimu za usajili", "subscription metrics", "nipe muhtasari wa usajili" | subscriptions.view | `getSubscriptionMetricsAction()` | `Subscription`, `SubscriptionPayment` |
| `plan-create` | "unda mpango mpya [name] [amount]", "create plan [name]" | subscriptions.manage | `createPlanAction()` | `SubscriptionPlan` |
| `plan-list` | "orodhesha mipango", "list plans", "nipe plans zote" | subscriptions.view | `listPlansAction()` | `SubscriptionPlan` |

### 5.5 Leads Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `lead-create` | "unda lead mpya [name] [phone]", "create lead [name]", "ongeza mtarajiwa [name]" | leads.create | `createLeadAction()` | `Lead`, `LeadActivity` |
| `lead-update` | "sasisha lead [id]", "update lead [id]", "badilisha taarifa za lead" | leads.update | `updateLeadAction()` | `Lead` |
| `lead-status` | "badilisha status ya lead [id] kuwa [status]", "move lead [id] to [status]" | leads.update | `updateLeadStatusAction()` | `Lead`, `LeadActivity` |
| `lead-assign` | "weka lead [id] kwa [sales rep]", "assign lead [id] to [user]" | leads.assign | `assignLeadAction()` | `LeadAssignment`, `Lead` |
| `lead-transfer` | "hamisha lead [id] kwa [user]", "transfer lead [id] to [user]" | leads.assign | `transferLeadAction()` | `LeadAssignment` |
| `lead-convert` | "badilisha lead [id] kuwa mteja", "convert lead [id] to customer" | leads.convert | `convertLeadAction()` | `Lead`, `LeadActivity` |
| `lead-followup` | "weka followup ya lead [id] baada ya siku [n]", "schedule followup for lead [id]" | leads.update | `addLeadActivityAction()` | `LeadActivity` |
| `lead-reminder` | "nikumbushe kumpigia [lead] kesho saa nne", "remind me to call [lead] tomorrow" | leads.view | Custom (notification) | `Notification`, `Lead` |
| `lead-list` | "nipe leads mpya za leo", "list leads", "orodhesha leads" | leads.view | `getLeadsAction()` | `Lead` |
| `lead-list-unfollowed` | "nipe leads ambazo hazijafuatiliwa wiki hii", "unfollowed leads this week" | leads.view | `getLeadsAction({status: NEW})` | `Lead` |
| `lead-summary` | "tengeneza summary ya leads za [region]", "lead summary for [area]" | leads.view | `getLeadMetricsAction()` | `Lead`, `LeadActivity` |
| `lead-metrics` | "takwimu za leads", "lead metrics", "nipe muhtasari wa leads" | leads.view | `getLeadMetricsAction()` | `Lead` |

### 5.6 Commissions Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `commission-calculate` | "hesabu tume kwa [profile]", "calculate commission for [sales rep]" | commissions.calculate | Custom (call calculation service) | `CommissionRule`, `CommissionLedger`, `SalesProfile` |
| `commission-ledger` | "angalia ledger ya tume", "view commission ledger", "nipe tume za [profile]" | commissions.view | `getCommissionEntriesAction()` | `CommissionLedger`, `SalesProfile` |
| `commission-approve` | "idhinisha tume [id]", "approve commission entry [id]" | commissions.approve | `approveCommissionEntryAction()` | `CommissionLedger` |
| `commission-payout` | "tengeneza payout ya tume", "generate payout summary", "malipo ya tume" | commissions.payout | `createPayoutAction()` | `CommissionPayout`, `CommissionLedger` |
| `commission-pending` | "nipe tume ambazo hazijalipwa", "pending payouts", "tume zinazosubiri" | commissions.view | `getPendingPayoutsAction()` | `CommissionLedger` |
| `commission-metrics` | "takwimu za tume za mwezi huu", "commission metrics this month", "nipe top performers" | commissions.view | `getCommissionMetricsAction()` | `CommissionLedger`, `SalesProfile` |

### 5.7 Sales Network Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `hierarchy-create` | "unda ngazi mpya ya [title]", "create hierarchy level [title]" | sales-network.manage | `createHierarchyLevelAction()` | `SalesHierarchy` |
| `profile-create` | "unda profile ya mauzo kwa [user]", "create sales profile for [user]" | sales-network.manage | `createProfileAction()` | `SalesProfile` |
| `profile-update` | "sasisha profile ya [user]", "update profile of [user]" | sales-network.manage | `updateProfileAction()` | `SalesProfile` |
| `team-tree` | "angalia timu ya [manager]", "view team tree of [manager]" | sales-network.view | `getTeamTreeAction()` | `SalesProfile` |
| `freelancers-list` | "nipe top freelancers wa mwezi huu", "list freelancers this month" | sales-network.view | `getFreelancersAction()` | `SalesProfile` |
| `profiles-list` | "orodhesha sales profiles", "list all sales profiles" | sales-network.view | `listProfilesAction()` | `SalesProfile`, `User` |
| `regional-performance` | "nipe sales performance ya kanda ya [region]", "sales performance for [region]" | sales-network.view | `getCommissionMetricsAction()` + filter | `CommissionLedger`, `SalesProfile` |

### 5.8 Support Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `ticket-create` | "unda ticket mpya [title]", "create support ticket [title]", "ripoti tatizo [description]" | support.create | `createTicketAction()` | `SupportTicket` |
| `ticket-update` | "sasisha ticket [id]", "update ticket [id]" | support.update | `updateTicketAction()` | `SupportTicket` |
| `ticket-assign` | "weka ticket [id] kwa [agent]", "assign ticket [id] to [user]" | support.assign | `assignTicketAction()` | `SupportTicket` |
| `ticket-resolve` | "maliza ticket [id]", "resolve ticket [id]" | support.update | `resolveTicketAction()` | `SupportTicket` |
| `ticket-close` | "funga ticket [id]", "close ticket [id]" | support.update | `closeTicketAction()` | `SupportTicket` |
| `ticket-escalate` | "pandisha ticket [id] kwa [level]", "escalate ticket [id]" | support.assign | `updateTicketAction({priority: HIGH})` | `SupportTicket` |
| `ticket-list` | "orodhesha tickets", "list tickets", "nipe tickets zote" | support.view | `listTicketsAction()` | `SupportTicket` |
| `ticket-metrics` | "takwimu za tickets", "ticket metrics", "nipe muhtasari wa tickets" | support.view | `getTicketMetricsAction()` | `SupportTicket` |

### 5.9 Marketing Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `campaign-create` | "unda kampeni mpya [name]", "create campaign [name]", "tengeneza tangazo [name]" | marketing.create | `createCampaignAction()` | `DistributionCampaign` |
| `campaign-launch` | "anzisha kampeni [id]", "launch campaign [id]" | marketing.manage | `launchCampaignAction()` | `DistributionCampaign` |
| `campaign-complete` | "maliza kampeni [id]", "complete campaign [id]" | marketing.manage | `completeCampaignAction()` | `DistributionCampaign` |
| `campaign-cancel` | "futa kampeni [id]", "cancel campaign [id]" | marketing.manage | `cancelCampaignAction()` | `DistributionCampaign` |
| `campaign-performance` | "angalia utendaji wa kampeni [id]", "campaign performance [id]" | marketing.view | `getCampaignMetricsAction()` | `DistributionCampaign`, `QRCode` |
| `campaign-list` | "orodhesha kampeni", "list campaigns" | marketing.view | `listCampaignsAction()` | `DistributionCampaign` |

### 5.10 Finance Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `wallet-view` | "angalia mkoba wa [business]", "view wallet of [business]", "salio la [business]" | finance.view | `check-wallet` tool (workspace) | `SubscriptionWallet` |
| `wallet-adjust` | "rekebisha mkoba wa [business] kwa [amount]", "adjust wallet [business] by [amount]" | finance.manage | Custom (create transaction) | `SubscriptionWallet`, `SubscriptionTransaction` |
| `transactions-list` | "orodhesha muamala wa [business]", "list transactions of [business]" | finance.view | `getPaymentsAction()` | `SubscriptionPayment`, `Payment` |
| `revenue-metrics` | "takwimu za mapato", "revenue metrics", "nipe mapato ya mwezi huu" | finance.view | `getRevenueMetricsAction()` | `Payment`, `Sale`, `SubscriptionPayment` |

### 5.11 Platform Admin Commands

| Intent | Example Phrases | Permission | Server Action | DB Tables |
|--------|----------------|------------|---------------|-----------|
| `settings-view` | "angalia setings za platform", "view platform settings" | settings.view | `getPlatformSettingAction()` | `Setting` |
| `settings-update` | "sasisha setting [key] kuwa [value]", "update [key] to [value]" | settings.manage | `savePlatformSettingsAction()` | `Setting` |
| `permission-create` | "unda ruhusa mpya [name]", "create permission [name]" | permissions.manage | `createPermissionAction()` | `Permission` |
| `role-create` | "unda jukumu jipya [name]", "create role [name]" | roles.manage | `createPlatformRoleAction()` | `Role` |
| `role-list` | "orodhesha majukumu", "list roles" | roles.view | `listPlatformRolesAction()` | `Role` |
| `platform-stats` | "takwimu za platform", "platform stats", "platform inaendeleaje" | platform.view | `getPlatformStatsAction()` | `User`, `Workspace`, `Business`, `Sale`, `SubscriptionPayment` |
| `system-health` | "angalia afya ya mfumo", "system health", "mfumo unaendelea vizuri?" | platform.view | `checkSystemHealthAction()` | `Upload`, DB ping |
| `recent-activity` | "shughuli za hivi karibuni", "recent activities", "nini kimetokea leo?" | platform.view | `getRecentActivityAction()` | `Activity` |

---

## 6. Sales Team Assistant Capabilities

### 6.1 Key Sales Team Workflows

The following real-world scenarios must be supported with natural Swahili:

| # | Scenario | Firdaus Intent | Implementation |
|---|----------|---------------|----------------|
| 1 | "Firdaus nipe leads mpya za leo" | `lead-list` | `getLeadsAction({status: NEW, date: today})` |
| 2 | "Firdaus nikumbushe kumpigia Ahmed kesho saa nne" | `lead-reminder` | Create notification + lead activity with followup date |
| 3 | "Firdaus weka followup ya mteja huyu baada ya siku tatu" | `lead-followup` | `addLeadActivityAction()` with 3-day followup + notification |
| 4 | "Firdaus nipe leads ambazo hazijafuatiliwa wiki hii" | `lead-list-unfollowed` | `getLeadsAction()` filtered by no activity in 7 days |
| 5 | "Firdaus tengeneza summary ya leads za Dar es Salaam" | `lead-summary` | `getLeadsAction()` filtered by region + aggregation |
| 6 | "Firdaus nipe biashara ambazo subscription zinaisha wiki hii" | `subscription-expiring` | `checkExpiringSubscriptionsAction()` with 7-day window |
| 7 | "Firdaus nipe list ya prospects wa wholesale" | `lead-list` | `getLeadsAction()` filtered by business type / source |
| 8 | "Firdaus assign lead huyu kwa John" | `lead-assign` | `assignLeadAction()` with name resolution |
| 9 | "Firdaus nipe top freelancers wa mwezi huu" | `freelancers-list` | `getFreelancersAction()` + `getCommissionMetricsAction()` sorted |
| 10 | "Firdaus nipe sales performance ya kanda ya Mwanza" | `regional-performance` | `getCommissionMetricsAction()` filtered by region |
| 11 | "Firdaus nipe leads zangu za leo" | `lead-list` | `getLeadsAction()` filtered by assignedToId |
| 12 | "Firdaus nipe mauzo yangu ya wiki hii" | `sales-performance` | `sale.aggregate()` filtered by salesProfile userId |
| 13 | "Firdaus nisaidie kupata lead mpya" | `lead-create` | Start lead creation workflow (ask name, phone, source) |
| 14 | "Firdaus lead [name] amevutiwa, nini cha kufanya?" | `lead-status` | Update status to INTERESTED + give next-step advice |
| 15 | "Firdaus nipe pipeline yangu" | `pipeline-view` | `getLeadsAction()` grouped by status for assigned rep |

### 6.2 Sales Team NLU Patterns

Additional NLU patterns needed for sales team workflows:

```typescript
// Lead discovery
"nipe leads (mpya|zangu|za leo|za wiki hii)"
"show me (new|my|today's|this week's) leads"
"wateja watarajiwa (wapya|wote)"

// Lead followup
"nikumbushe kumpigia <name> (kesho|baada ya siku <n>)"
"remind me to call <name> (tomorrow|in <n> days)"
"weka followup ya <name> baada ya siku <n>"
"schedule followup for <name> in <n> days"

// Pipeline
"nipe pipeline yangu"
"show my pipeline"
"lead <name> yuko wapi?"

// Assign
"assign lead <id> kwa <name>"
"weka lead <id> kwa <name>"
"mpe <name> lead <id>"

// Summary
"tengeneza summary ya leads za <region>"
"lead summary for <region>"
"nipe muhtasari wa leads"

// Conversion
"badilisha lead <id> kuwa mteja"
"convert lead <id>"
"lead <name> amekubali, badilisha"

// Performance
"nipe sales performance ya kanda ya <region>"
"sales performance for <region>"
"utendaji wa timu ya <region>"
"top (freelancers|wahudumu|sales) wa mwezi huu"

// Expiry
"nipe biashara ambazo subscription zinaisha wiki hii"
"subscriptions expiring this week"
"biashara zenye usajili unaokwisha"

// Commission
"tume yangu ya mwezi huu"
"my commission this month"
"nipe tume zangu"
```

### 6.3 Notification & Reminder System for Sales

Sales team workflows require a notification system for:
1. **Followup reminders** — Schedule a notification to remind a sales rep to call a lead at a specific time
2. **Lead status changes** — Notify assigned rep when their lead's status changes
3. **Expiring subscriptions** — Notify assigned rep when customer's subscription is ending
4. **Daily digest** — Morning summary of assigned leads, followups due today

The existing `Notification` model supports this:
- `userId` → assigned sales rep
- `type` → "lead_followup", "subscription_expiry", "lead_assigned", "daily_digest"
- `referenceType`/`referenceId` → link back to the lead/subscription
- `scheduledAt` → future date for the reminder

---

## 7. Permission System Overhaul

### 7.1 Current Problem

The `checkPermission()` in `src/features/enkai/services/permission-service.ts` only checks `Staff` records:

```typescript
// Current: only checks Staff (business-scoped)
const staff = await prisma.staff.findFirst({
  where: { userId, businessId },
});
if (!staff) return { allowed: false };  // Platform users always fail here!
```

Platform users (super admin, sales team members) have **no** `Staff` record, so they always get `{ allowed: false }`.

### 7.2 Required Changes

**A. Platform Permission Checker** (`checkPlatformPermission`)

New function that checks `UserRole` records where `Role.scope === "PLATFORM"`:

```typescript
async function checkPlatformPermission(
  userId: string,
  requiredPermission: string
): Promise<{ allowed: boolean; role?: string }> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      role: { scope: "PLATFORM" },
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
  for (const ur of userRoles) {
    const hasWildcard = ur.role.rolePermissions.some(
      (rp) => rp.permission.slug === "*"
    );
    if (hasWildcard) return { allowed: true, role: ur.role.name };
    const hasPermission = ur.role.rolePermissions.some(
      (rp) => rp.permission.slug === requiredPermission
    );
    if (hasPermission) return { allowed: true, role: ur.role.name };
  }
  return { allowed: false };
}
```

**B. Unified Permission Check** (`enforcePermission`)

Route to platform or business permission checker based on mode:

```typescript
async function enforcePermission(
  userId: string,
  businessId: string | undefined,
  requiredPermission: string,
  mode: FirdausMode
): Promise<{ allowed: boolean }> {
  if (mode === "platform") {
    return checkPlatformPermission(userId, requiredPermission);
  }
  return checkPermission(userId, businessId!, requiredPermission);
}
```

### 7.3 Permission Slug Convention

All permissions follow the `{module}.{action}` pattern:

| Module | Permission Slugs |
|--------|-----------------|
| users | `users.create`, `users.view`, `users.update`, `users.delete` |
| workspaces | `workspaces.create`, `workspaces.view`, `workspaces.update`, `workspaces.delete`, `workspaces.manage` |
| businesses | `businesses.create`, `businesses.view`, `businesses.update`, `businesses.delete` |
| subscriptions | `subscriptions.view`, `subscriptions.manage` |
| leads | `leads.create`, `leads.view`, `leads.update`, `leads.assign`, `leads.convert` |
| commissions | `commissions.view`, `commissions.calculate`, `commissions.approve`, `commissions.payout` |
| sales-network | `sales-network.view`, `sales-network.manage` |
| support | `support.create`, `support.view`, `support.update`, `support.assign` |
| marketing | `marketing.create`, `marketing.view`, `marketing.manage` |
| finance | `finance.view`, `finance.manage` |
| platform | `platform.view`, `platform.manage` |
| settings | `settings.view`, `settings.manage` |
| roles | `roles.view`, `roles.manage`, `roles.assign` |
| permissions | `permissions.manage` |

---

## 8. Implementation Roadmap

### Phase 1: Foundation — Platform Intent System

**Effort:** 3–5 days | **Dependencies:** None

1. Create `src/features/enkai/commands/platform-intents.ts`
   - Define 50+ new intent types for platform operations
   - Group by domain: USERS, WORKSPACES, BUSINESSES, SUBSCRIPTIONS, LEADS, COMMISSIONS, SALES_NETWORK, SUPPORT, MARKETING, FINANCE, PLATFORM_ADMIN

2. Create `src/features/enkai/commands/platform-command-parser.ts`
   - 80+ NLU patterns for platform operations (Swahili + English)
   - Sales-team-specific patterns

3. Create `src/features/enkai/utils/platform-language-pack.ts`
   - Term mappings (English ↔ Swahili)
   - Status vocabulary
   - Action verb mappings

4. Update `business-brain.ts`
   - Replace `handlePlatformRequest()` regex approach with intent routing
   - Route to domain-specific handlers

### Phase 2: Permission System Overhaul

**Effort:** 2–3 days | **Dependencies:** None

1. Create `src/features/enkai/services/platform-permission-service.ts`
   - `checkPlatformPermission()` — UserRole-based for platform scope
   - `enforcePermission()` — Unified checker routing by mode

2. Update `business-brain.ts` `processWithBrain()` for platform mode
   - Add permission check before executing platform commands
   - Route unauthorized requests to error handler

3. Update `src/features/enkai/services/permission-service.ts`
   - Add platform-aware fallback

### Phase 3: Platform Command Execution Layer

**Effort:** 5–7 days | **Dependencies:** Phase 1, Phase 2

For each domain, create a handler that calls existing server actions:

1. **Users Handler** — `user-invite`, `user-deactivate`, `user-activate`, `user-assign-role`, `user-remove-role`, `user-list`, `user-search`
2. **Workspaces Handler** — `workspace-create`, `workspace-update`, `workspace-archive`, `workspace-invite-member`, `workspace-remove-member`
3. **Businesses Handler** — `business-create`, `business-update`, `business-activate`, `business-suspend`, `business-search`
4. **Subscriptions Handler** — `subscription-view`, `subscription-list`, `subscription-activate`, `subscription-suspend`, `subscription-renew`, `subscription-expiring`, `plan-create`, `plan-list`
5. **Leads Handler** — `lead-create`, `lead-update`, `lead-status`, `lead-assign`, `lead-transfer`, `lead-convert`, `lead-followup`, `lead-summary`, `lead-list`, `lead-metrics`
6. **Commissions Handler** — `commission-ledger`, `commission-approve`, `commission-payout`, `commission-pending`, `commission-metrics`
7. **Sales Network Handler** — `hierarchy-create`, `profile-create`, `profile-update`, `team-tree`, `freelancers-list`, `profiles-list`
8. **Support Handler** — `ticket-create`, `ticket-update`, `ticket-assign`, `ticket-resolve`, `ticket-close`, `ticket-escalate`, `ticket-list`
9. **Marketing Handler** — `campaign-create`, `campaign-launch`, `campaign-cancel`, `campaign-performance`
10. **Finance Handler** — `wallet-view`, `transactions-list`, `revenue-metrics`
11. **Platform Admin Handler** — `settings-view`, `settings-update`, `permission-create`, `role-create`, `platform-stats`, `system-health`, `recent-activity`

### Phase 4: Sales Team Workflows

**Effort:** 3–4 days | **Dependencies:** Phase 3 (Leads Handler)

1. **Reminder System**
   - `scheduleReminder()` — Creates Notification with future timestamp
   - `getTodayReminders()` — Fetches today's followups for user
   - Background job to fire due reminders

2. **Pipeline View**
   - Group leads by status for assigned rep
   - Show counts + next actions per stage

3. **Regional Performance**
   - Aggregate commission data by region/territory
   - Leaderboard generation

4. **Followup Sequencing**
   - Multi-step lead nurturing workflow
   - Auto-create next followup when current one completes

### Phase 5: Platform Memory & Self-Learning

**Effort:** 2–3 days | **Dependencies:** Phase 3

1. Create `FREQUENT_LEAD_SOURCE`, `TOP_SALES_REP`, `COMMON_TICKET_TYPE` memory types
2. Learn from platform operations outcomes
3. Use platform memory to personalize responses

### Phase 6: Audit & Monitoring

**Effort:** 1–2 days | **Dependencies:** Phase 3

1. All platform operations logged to `AuditLog` with `resourceType` per domain
2. Platform operations dashboard integration
3. Error rate monitoring per domain

---

## 9. Coverage Matrix

### Current vs. Target Coverage

| Domain | Total Ops | Current | Target | Gap |
|--------|-----------|---------|--------|-----|
| Users | 10 | 1 (count) | 9 | 8 |
| Workspaces | 6 | 1 (count) | 6 | 5 |
| Businesses | 6 | 1 (count) | 6 | 5 |
| Subscriptions | 11 | 1 (count) | 10 | 9 |
| Leads | 12 | 1 (count) | 11 | 10 |
| Commissions | 6 | 0 | 6 | 6 |
| Sales Network | 7 | 0 | 7 | 7 |
| Support | 8 | 0 | 8 | 8 |
| Marketing | 6 | 0 | 6 | 6 |
| Finance | 4 | 1 (workspace) | 4 | 3 |
| Platform Admin | 8 | 1 (stats) | 8 | 7 |
| **Total** | **84** | **6 (7%)** | **81** | **74** |

### Implementation Order by Value

| Priority | Domain | Value | Effort | Phase |
|----------|--------|-------|--------|-------|
| 1 | **Leads** | Sales team can manage pipeline immediately | Medium | Phase 3 |
| 2 | **Users** | Platform admin can manage users via voice | Low | Phase 3 |
| 3 | **Subscriptions** | Sales can check/manage renewals | Medium | Phase 3 |
| 4 | **Sales Team Workflows** | Full sales team productivity boost | High | Phase 4 |
| 5 | **Support** | Support team can triage via voice | Low | Phase 3 |
| 6 | **Commissions** | Sales can check earnings | Medium | Phase 3 |
| 7 | **Businesses** | Platform admin can manage businesses | Low | Phase 3 |
| 8 | **Workspaces** | Platform admin can manage workspaces | Low | Phase 3 |
| 9 | **Marketing** | Marketing can manage campaigns | Medium | Phase 3 |
| 10 | **Sales Network** | Manage hierarchy and profiles | Low | Phase 3 |
| 11 | **Finance** | View wallet, transactions | Low | Phase 3 |
| 12 | **Platform Admin** | Settings, roles, permissions | Low | Phase 3 |

### Completion Criteria

Firdaus achieves **100% Platform Operation Coverage** when:

1. Every operation listed in Section 5 has a corresponding intent in `platform-intents.ts`
2. Every operation can be triggered via natural Swahili or English voice/phrase
3. Every operation checks permissions via `enforcePermission()` before executing
4. Every mutation calls the existing server action from the feature module
5. Every operation is logged to `AuditLog`
6. Sales team workflows (Section 6) work end-to-end with reminder notifications
7. All new files have zero TypeScript errors
8. Platform mode `handlePlatformRequest()` is replaced or fully extended

**Estimated total effort:** 16–24 days (6 phases)
**Estimated lines of code:** 3,000–5,000 new lines across ~25 new/updated files
