import { test, expect } from "@playwright/test";
import { registerUser, authHeader } from "./helpers/auth";

test.describe("Billing — Checkout", () => {
  test("requires authentication", async ({ request }) => {
    const res = await request.post("/billing/checkout", {
      data: { plan: "pro" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects invalid plan", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/billing/checkout", {
      headers: authHeader(accessToken),
      data: { plan: "invalid-plan" },
    });
    // Either 400 (bad plan) or 403 (email not verified)
    expect([400, 403]).toContain(res.status());
  });
});

test.describe("Billing — Portal", () => {
  test("requires authentication", async ({ request }) => {
    const res = await request.get("/billing/portal");
    expect(res.status()).toBe(401);
  });

  test("returns error when user has no Stripe customer", async ({
    request,
  }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.get("/billing/portal", {
      headers: authHeader(accessToken),
    });
    // 400 (no Stripe customer) or 403 (email not verified)
    expect([400, 403]).toContain(res.status());
  });
});

test.describe("Billing — Cancel", () => {
  test("requires authentication", async ({ request }) => {
    const res = await request.post("/billing/cancel");
    expect(res.status()).toBe(401);
  });

  test("returns error when no active subscription", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/billing/cancel", {
      headers: authHeader(accessToken),
    });
    // 400 (no subscription) or 403 (email not verified)
    expect([400, 403]).toContain(res.status());
  });
});

test.describe("Billing — Upgrade", () => {
  test("requires authentication", async ({ request }) => {
    const res = await request.post("/billing/upgrade");
    expect(res.status()).toBe(401);
  });

  test("rejects upgrade for non-starter user", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/billing/upgrade", {
      headers: authHeader(accessToken),
    });
    // 400 (not a starter user) or 403 (email not verified)
    expect([400, 403]).toContain(res.status());
  });
});

test.describe("Billing — Webhook", () => {
  test("rejects webhook without Stripe signature", async ({ request }) => {
    const res = await request.post("/billing/webhook", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("rejects webhook with invalid signature", async ({ request }) => {
    const res = await request.post("/billing/webhook", {
      headers: { "stripe-signature": "invalid-sig" },
      data: JSON.stringify({}),
    });
    expect(res.status()).toBe(400);
  });
});
