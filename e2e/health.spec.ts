import { test, expect } from "@playwright/test";

test.describe("Health & Config", () => {
  test("GET /health returns ok status", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBe("2.0.0");
  });

  test("GET /config returns max_bulk_urls", async ({ request }) => {
    const res = await request.get("/config");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.max_bulk_urls).toBeGreaterThan(0);
    expect(typeof body.max_bulk_urls).toBe("number");
  });

  test("responses include security headers", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(res.headers()["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()"
    );
  });
});
