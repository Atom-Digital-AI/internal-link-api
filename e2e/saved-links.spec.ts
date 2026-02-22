import { test, expect } from "@playwright/test";
import { registerUser, authHeader } from "./helpers/auth";

/**
 * Saved-links endpoints require a Pro plan subscription.
 * These tests verify access control and error handling.
 */

test.describe("Saved Links — Plan enforcement", () => {
  test("free user cannot list saved links", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.get("/saved-links", {
      headers: authHeader(accessToken),
    });
    // Free users get 403 (email not verified or plan check)
    expect(res.status()).toBe(403);
  });

  test("free user cannot create a saved link", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/saved-links", {
      headers: authHeader(accessToken),
      data: { link_data: { url: "https://example.com", anchor: "test" } },
    });
    expect(res.status()).toBe(403);
  });

  test("unauthenticated user cannot list saved links", async ({ request }) => {
    const res = await request.get("/saved-links");
    expect(res.status()).toBe(401);
  });

  test("unauthenticated user cannot create a saved link", async ({
    request,
  }) => {
    const res = await request.post("/saved-links", {
      data: { link_data: { url: "https://example.com" } },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Saved Links — Error handling", () => {
  test("DELETE /saved-links/{invalid-id} returns 403 or 404", async ({
    request,
  }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.delete("/saved-links/not-a-uuid", {
      headers: authHeader(accessToken),
    });
    expect([403, 404]).toContain(res.status());
  });

  test("DELETE /saved-links/{nonexistent-uuid} returns 403 or 404", async ({
    request,
  }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.delete(
      "/saved-links/00000000-0000-0000-0000-000000000000",
      {
        headers: authHeader(accessToken),
      }
    );
    expect([403, 404]).toContain(res.status());
  });

  test("bulk DELETE /saved-links requires authentication", async ({
    request,
  }) => {
    const res = await request.delete("/saved-links", {
      data: { ids: ["00000000-0000-0000-0000-000000000000"] },
    });
    expect(res.status()).toBe(401);
  });
});
