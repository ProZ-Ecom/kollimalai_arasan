/**
 * Centralized Environment Configuration & Runtime Safety Controls
 * 
 * Enforces strict environment separation between:
 * 1. Local Development / Test (allows controlled mock data, tracking simulation, and simulated refunds)
 * 2. Production (strictly enforces live external services, genuine tokens, and blocks any simulated side-effects)
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}

/**
 * Returns true if Shiprocket Sandbox API is explicitly configured.
 * In production, sandbox requests are blocked unless deliberately running in a staging environment.
 */
export function isShiprocketSandbox(): boolean {
  if (isProduction()) {
    return false;
  }
  return process.env.SHIPROCKET_TEST_MODE === "true";
}

/**
 * Returns true if local tracking simulation is explicitly permitted.
 * STRICT: Only permitted if NODE_ENV === 'development' AND SHIPROCKET_LOCAL_TRACKING_SIMULATION === 'true'.
 * Always returns false in production.
 */
export function isLocalTrackingSimulationAllowed(): boolean {
  if (isProduction()) {
    return false;
  }
  return (
    isDevelopment() &&
    process.env.SHIPROCKET_LOCAL_TRACKING_SIMULATION === "true"
  );
}

/**
 * Returns true if local mock fallback (e.g. generating a local mock AWB when Shiprocket sandbox is unreachable) is permitted.
 * STRICT: Always returns false in production. In production, real API errors must fail closed.
 */
export function isShiprocketMockFallbackAllowed(): boolean {
  if (isProduction()) {
    return false;
  }
  return (
    isDevelopment() &&
    (process.env.SHIPROCKET_LOCAL_MOCK_FALLBACK === "true" ||
      process.env.SHIPROCKET_LOCAL_TRACKING_SIMULATION === "true")
  );
}

/**
 * Returns true if simulated refund workflow is explicitly permitted.
 * STRICT: Always returns false in production.
 * Must be explicitly enabled in development via REFUND_SIMULATION_ENABLED === 'true'.
 */
export function isRefundSimulationAllowed(): boolean {
  if (isProduction()) {
    return false;
  }
  return isDevelopment() && process.env.REFUND_SIMULATION_ENABLED === "true";
}

/**
 * Razorpay Environment Safety Verification.
 * Prevents using rzp_live_ keys in development to avoid accidental live financial transactions.
 */
export function getRazorpayEnvironment(): {
  mode: "live" | "test" | "unconfigured";
  keyId?: string;
} {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)?.trim();
  if (!keyId) {
    return { mode: "unconfigured" };
  }

  const isLive = keyId.startsWith("rzp_live_") || keyId.startsWith("Rzp_live_");
  const isTest = keyId.startsWith("rzp_test_") || keyId.startsWith("Rzp_test_");

  if (isLive) {
    return { mode: "live", keyId };
  }
  if (isTest) {
    return { mode: "test", keyId };
  }

  return { mode: "unconfigured", keyId };
}

/**
 * Throws a fatal security error if a simulation-only feature is triggered in production.
 */
export function assertNotProduction(featureName: string): void {
  if (isProduction()) {
    throw new Error(
      `[SECURITY ALERT] ${featureName} is strictly prohibited in production environment.`
    );
  }
}

