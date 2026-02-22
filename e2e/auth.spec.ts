import { test, expect } from "@playwright/test";
import {
  registerUser,
  loginUser,
  authHeader,
  uniqueEmail,
  TEST_PASSWORD,
} from "./helpers/auth";

test.describe("Auth — Registration", () => {
  test("registers a new user successfully", async ({ request }) => {
    const email = uniqueEmail();
    const res = await request.post("/auth/register", {
      data: {
        email,
        password: TEST_PASSWORD,
        confirm_password: TEST_PASSWORD,
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.token_type).toBe("bearer");
  });

  test("rejects registration with mismatched passwords", async ({
    request,
  }) => {
    const res = await request.post("/auth/register", {
      data: {
        email: uniqueEmail(),
        password: TEST_PASSWORD,
        confirm_password: "DifferentPass1!",
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("Passwords do not match");
  });

  test("rejects registration with weak password", async ({ request }) => {
    const res = await request.post("/auth/register", {
      data: {
        email: uniqueEmail(),
        password: "short",
        confirm_password: "short",
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("Password must be at least 10 characters");
  });

  test("rejects registration with password missing a digit", async ({
    request,
  }) => {
    const res = await request.post("/auth/register", {
      data: {
        email: uniqueEmail(),
        password: "NoDigitsHere!@",
        confirm_password: "NoDigitsHere!@",
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("digit");
  });

  test("rejects registration with password missing a special char", async ({
    request,
  }) => {
    const res = await request.post("/auth/register", {
      data: {
        email: uniqueEmail(),
        password: "NoSpecial123abc",
        confirm_password: "NoSpecial123abc",
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("special character");
  });

  test("rejects duplicate email registration", async ({ request }) => {
    const email = uniqueEmail();
    await registerUser(request, { email });

    const res = await request.post("/auth/register", {
      data: {
        email,
        password: TEST_PASSWORD,
        confirm_password: TEST_PASSWORD,
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.detail).toContain("already exists");
  });
});

test.describe("Auth — Login", () => {
  test("logs in with valid credentials", async ({ request }) => {
    const email = uniqueEmail();
    await registerUser(request, { email });

    const res = await request.post("/auth/login", {
      data: {
        email,
        password: TEST_PASSWORD,
        remember_me: false,
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.token_type).toBe("bearer");
  });

  test("rejects login with wrong password", async ({ request }) => {
    const email = uniqueEmail();
    await registerUser(request, { email });

    const res = await request.post("/auth/login", {
      data: {
        email,
        password: "WrongPassword1!",
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.detail).toContain("Invalid email or password");
  });

  test("rejects login with nonexistent email", async ({ request }) => {
    const res = await request.post("/auth/login", {
      data: {
        email: "nonexistent@example.com",
        password: TEST_PASSWORD,
        turnstile_token: "test-token",
      },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Auth — Logout", () => {
  test("POST /auth/logout returns 200", async ({ request }) => {
    const res = await request.post("/auth/logout");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Logged out");
  });
});

test.describe("Auth — Token refresh", () => {
  test("rejects refresh without cookie", async ({ request }) => {
    const res = await request.post("/auth/refresh");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.detail).toContain("No refresh token");
  });
});

test.describe("Auth — Forgot password", () => {
  test("returns success even for unknown email (no info leak)", async ({
    request,
  }) => {
    const res = await request.post("/auth/forgot-password", {
      data: { email: "nobody@example.com" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("reset link has been sent");
  });
});

test.describe("Auth — Reset password", () => {
  test("rejects reset with invalid token", async ({ request }) => {
    const res = await request.post("/auth/reset-password", {
      data: {
        token: "invalid-token",
        new_password: "NewPassword1!",
        confirm_password: "NewPassword1!",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("invalid or has expired");
  });

  test("rejects reset with mismatched passwords", async ({ request }) => {
    const res = await request.post("/auth/reset-password", {
      data: {
        token: "any-token",
        new_password: "NewPassword1!",
        confirm_password: "DifferentPass1!",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("Passwords do not match");
  });
});

test.describe("Auth — Verify email", () => {
  test("rejects verification with invalid token", async ({ request }) => {
    const res = await request.post("/auth/verify-email", {
      data: { token: "bad-token-value" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("invalid or has expired");
  });
});

test.describe("Auth — Resend verification", () => {
  test("requires authentication", async ({ request }) => {
    const res = await request.post("/auth/resend-verification");
    expect(res.status()).toBe(401);
  });

  test("sends verification email for unverified user", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/auth/resend-verification", {
      headers: authHeader(accessToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Verification email sent");
  });
});
