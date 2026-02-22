import { test, expect } from "@playwright/test";

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "test-internal-secret";

test.describe("Internal — Cleanup sessions", () => {
  test("rejects without secret header", async ({ request }) => {
    const res = await request.post("/internal/cleanup-sessions");
    expect(res.status()).toBe(403);

    const body = await res.json();
    expect(body.detail).toBe("Forbidden");
  });

  test("rejects with wrong secret header", async ({ request }) => {
    const res = await request.post("/internal/cleanup-sessions", {
      headers: { "X-Internal-Secret": "wrong-secret" },
    });
    expect(res.status()).toBe(403);
  });

  test("succeeds with correct secret header", async ({ request }) => {
    const res = await request.post("/internal/cleanup-sessions", {
      headers: { "X-Internal-Secret": INTERNAL_SECRET },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(typeof body.users_cleaned).toBe("number");
    expect(typeof body.sessions_deleted).toBe("number");
    expect(typeof body.links_deleted).toBe("number");
  });
});
