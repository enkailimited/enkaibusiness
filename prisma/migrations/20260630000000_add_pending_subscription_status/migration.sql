-- Add PENDING to SubscriptionStatus enum
-- Business registration creates subscriptions with PENDING status before activation
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';
