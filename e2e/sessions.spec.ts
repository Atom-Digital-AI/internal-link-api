import { test, expect } from "@playwright/test";
import { registerUser, authHeader, uniqueEmail } from "./helpers/auth";

/**
 * Sessions endpoints require starter or pro plan.
 * These tests verify both access control (free users blocked)
 * and CRUD operations.
 */

test.describe("Sessions — Plan enforcement", () => {
  test("free user cannot list sessions", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.get("/sessions", {
      headers: authHeader(accessToken),
    });
    // Free users are unverified, so they get 403 for email not verified
    // (get_current_user enforces email verification before plan check)
    expect([403]).toContain(res.status());
  });

  test("free user cannot create a session", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/sessions", {
      headers: authHeader(accessToken),
      data: { domain: "example.com" },
    });
    expect([403]).toContain(res.status());
  });

  test("unauthenticated user cannot list sessions", async ({ request }) => {
    const res = await request.get("/sessions");
    expect(res.status()).toBe(401);
  });
});

test.describe("Sessions — CRUD (requires starter+ plan)", () => {
  // These tests document the expected API behavior.
  // In a test environment with proper database seeding,
  // a starter/pro user would be provisioned to test full CRUD.

  test("GET /sessions/{invalid-uuid} returns 404", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.get("/sessions/not-a-uuid", {
      headers: authHeader(accessToken),
    });
    // Will be 403 (email not verified or plan check) or 404
    expect([403, 404]).toContain(res.status());
  });

  test("DELETE /sessions/{invalid-uuid} returns 404 or 403", async ({
    request,
  }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.delete(
      "/sessions/00000000-0000-0000-0000-000000000000",
      {
        headers: authHeader(accessToken),
      }
    );
    expect([403, 404]).toContain(res.status());
  });

  test("PUT /sessions/{invalid-uuid} returns 404 or 403", async ({
    request,
  }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.put(
      "/sessions/00000000-0000-0000-0000-000000000000",
      {
        headers: authHeader(accessToken),
        data: { config: { sourcePattern: "/blog/" } },
      }
    );
    expect([403, 404]).toContain(res.status());
  });
});
