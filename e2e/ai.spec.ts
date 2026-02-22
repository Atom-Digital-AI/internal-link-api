import { test, expect } from "@playwright/test";
import { registerUser, authHeader } from "./helpers/auth";

test.describe("AI — Suggest", () => {
  test("requires authentication", async ({ request }) => {
    const res = await request.post("/ai/suggest", {
      data: {
        source_url: "https://example.com/blog/test",
        source_content: "Some content about SEO and marketing.",
        target_url: "https://example.com/services/seo",
        target_title: "SEO Services",
        target_keywords: ["seo", "marketing"],
      },
    });
    expect(res.status()).toBe(401);
  });

  test("free user is rejected (requires starter or pro)", async ({
    request,
  }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/ai/suggest", {
      headers: authHeader(accessToken),
      data: {
        source_url: "https://example.com/blog/test",
        source_content: "Some content about SEO and marketing.",
        target_url: "https://example.com/services/seo",
        target_title: "SEO Services",
        target_keywords: ["seo", "marketing"],
      },
    });
    // 403 for email not verified or plan restriction
    expect(res.status()).toBe(403);
  });
});
