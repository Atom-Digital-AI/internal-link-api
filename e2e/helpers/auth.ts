import { APIRequestContext } from "@playwright/test";

let userCounter = 0;

/**
 * Generate a unique email for test isolation.
 */
export function uniqueEmail(): string {
  userCounter++;
  return `test_${Date.now()}_${userCounter}@example.com`;
}

/**
 * A strong password that passes validation (10+ chars, letter, digit, special char).
 */
export const TEST_PASSWORD = "TestPass123!";

/**
 * Register a new user and return the access token.
 * Turnstile verification is skipped when TURNSTILE_SECRET_KEY is unset.
 */
export async function registerUser(
  request: APIRequestContext,
  opts?: { email?: string; password?: string }
): Promise<{ accessToken: string; email: string }> {
  const email = opts?.email ?? uniqueEmail();
  const password = opts?.password ?? TEST_PASSWORD;

  const res = await request.post("/auth/register", {
    data: {
      email,
      password,
      confirm_password: password,
      turnstile_token: "test-token",
    },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Register failed (${res.status()}): ${body}`);
  }

  const json = await res.json();
  return { accessToken: json.access_token, email };
}

/**
 * Login an existing user and return the access token.
 */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string = TEST_PASSWORD
): Promise<{ accessToken: string }> {
  const res = await request.post("/auth/login", {
    data: {
      email,
      password,
      remember_me: false,
      turnstile_token: "test-token",
    },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status()}): ${body}`);
  }

  const json = await res.json();
  return { accessToken: json.access_token };
}

/**
 * Build an Authorization header from a token.
 */
export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
