// Auth Module — Layer 0 Foundation
// Wraps Better Auth configuration and provides convenience actions/components.

// Re-export lib-level auth for convenience
export { auth } from "@/lib/auth";
export { authClient } from "@/lib/auth-client";

// Re-export server-side session helpers
export { getCurrentUser, getSessionUser, requireAuth } from "@/server/auth";

// Service exports
export { login, loginWithEmail } from "./services/login-service";
export { register } from "./services/register-service";
export { requestPasswordReset, resetPassword } from "./services/password-reset-service";
export { getCurrentSession, validateSession, refreshSession } from "./services/session-service";

// Diagnostics
export { runAuthDiagnostics } from "./diagnostics/auth-diagnostics";
export type { AuthDiagnosticResult } from "./diagnostics/auth-diagnostics";

// Feature-level exports
export * from "./types";
export * from "./constants";
export * from "./schemas";
export * from "./actions";
export * from "./components/auth-provider";
export * from "./components/login-form";
export * from "./components/register-form";
