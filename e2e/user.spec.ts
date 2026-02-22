import { test, expect } from "@playwright/test";
import {
  registerUser,
  authHeader,
  uniqueEmail,
  TEST_PASSWORD,
} from "./helpers/auth";

test.describe("User — GET /user/me", () => {
  test("returns current user profile", async ({ request }) => {
    const { accessToken, email } = await registerUser(request);

    const res = await request.get("/user/me", {
      headers: authHeader(accessToken),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.email).toBe(email);
    expect(body.plan).toBe("free");
    expect(body.id).toBeTruthy();
    expect(body.has_password).toBe(true);
    expect(body.has_google).toBe(false);
    expect(body.email_verified).toBe(false);
    expect(body.created_at).toBeTruthy();
  });

  test("rejects unauthenticated access", async ({ request }) => {
    const res = await request.get("/user/me");
    expect(res.status()).toBe(401);
  });

  test("rejects invalid token", async ({ request }) => {
    const res = await request.get("/user/me", {
      headers: authHeader("invalid-jwt-token"),
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("User — GET /user/me/subscription", () => {
  test("returns no subscription for new user", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.get("/user/me/subscription", {
      headers: authHeader(accessToken),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.has_subscription).toBe(false);
    expect(body.status).toBeNull();
    expect(body.current_period_end).toBeNull();
  });

  test("requires authentication", async ({ request }) => {
    const res = await request.get("/user/me/subscription");
    expect(res.status()).toBe(401);
  });
});

test.describe("User — GET /user/me/usage", () => {
  test("returns zero usage for new user", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.get("/user/me/usage", {
      headers: authHeader(accessToken),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.call_count).toBe(0);
    expect(body.limit).toBe(0); // free plan has 0 AI limit
  });

  test("requires authentication", async ({ request }) => {
    const res = await request.get("/user/me/usage");
    expect(res.status()).toBe(401);
  });
});

test.describe("User — PATCH /user/me (update email)", () => {
  test("rejects without authentication", async ({ request }) => {
    const res = await request.patch("/user/me", {
      data: {
        new_email: "new@example.com",
        current_password: TEST_PASSWORD,
      },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects with wrong current password", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.patch("/user/me", {
      headers: authHeader(accessToken),
      data: {
        new_email: uniqueEmail(),
        current_password: "WrongPassword1!",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.detail).toContain("password is incorrect");
  });

  test("rejects when new email is the same as current", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const { accessToken } = await registerUser(request, { email });

    const res = await request.patch("/user/me", {
      headers: authHeader(accessToken),
      data: {
        new_email: email,
        current_password: TEST_PASSWORD,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("same as your current email");
  });

  test("updates email with correct password", async ({ request }) => {
    const { accessToken } = await registerUser(request);
    const newEmail = uniqueEmail();

    const res = await request.patch("/user/me", {
      headers: authHeader(accessToken),
      data: {
        new_email: newEmail,
        current_password: TEST_PASSWORD,
      },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.email).toBe(newEmail);
    expect(body.email_verified).toBe(false); // re-verification required
  });
});

test.describe("User — POST /user/change-password", () => {
  test("rejects without authentication", async ({ request }) => {
    const res = await request.post("/user/change-password", {
      data: {
        current_password: TEST_PASSWORD,
        new_password: "NewPassword1!",
        confirm_password: "NewPassword1!",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects with wrong current password", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/user/change-password", {
      headers: authHeader(accessToken),
      data: {
        current_password: "WrongPassword1!",
        new_password: "BrandNew123!!",
        confirm_password: "BrandNew123!!",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.detail).toContain("password is incorrect");
  });

  test("rejects when new passwords don't match", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/user/change-password", {
      headers: authHeader(accessToken),
      data: {
        current_password: TEST_PASSWORD,
        new_password: "BrandNew123!!",
        confirm_password: "DifferentNew1!",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("do not match");
  });

  test("rejects when new password is same as current", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/user/change-password", {
      headers: authHeader(accessToken),
      data: {
        current_password: TEST_PASSWORD,
        new_password: TEST_PASSWORD,
        confirm_password: TEST_PASSWORD,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("different from your current password");
  });

  test("changes password successfully", async ({ request }) => {
    const email = uniqueEmail();
    const { accessToken } = await registerUser(request, { email });
    const newPassword = "BrandNew123!!";

    const res = await request.post("/user/change-password", {
      headers: authHeader(accessToken),
      data: {
        current_password: TEST_PASSWORD,
        new_password: newPassword,
        confirm_password: newPassword,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Password changed");

    // Verify login works with new password
    const loginRes = await request.post("/auth/login", {
      data: {
        email,
        password: newPassword,
        turnstile_token: "test-token",
      },
    });
    expect(loginRes.status()).toBe(200);
  });
});
