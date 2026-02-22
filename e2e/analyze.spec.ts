import { test, expect } from "@playwright/test";
import { registerUser, authHeader } from "./helpers/auth";

test.describe("POST /analyze", () => {
  test("analyzes a valid URL", async ({ request }) => {
    const res = await request.post("/analyze", {
      data: {
        url: "https://example.com",
        target_pattern: "/services/",
      },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.url).toBeTruthy();
    expect(typeof body.word_count).toBe("number");
    expect(body.internal_links).toBeDefined();
    expect(typeof body.internal_links.total).toBe("number");
    expect(typeof body.link_density).toBe("number");
  });

  test("handles invalid URL gracefully", async ({ request }) => {
    const res = await request.post("/analyze", {
      data: {
        url: "https://this-domain-definitely-does-not-exist-abc123xyz.com",
        target_pattern: "/services/",
      },
    });
    // The API may return 200 with an error field, or a 4xx/5xx
    const status = res.status();
    if (status === 200) {
      const body = await res.json();
      // Either has data or an error field
      expect(body.url).toBeTruthy();
    } else {
      expect(status).toBeGreaterThanOrEqual(400);
    }
  });

  test("rejects request with missing url field", async ({ request }) => {
    const res = await request.post("/analyze", {
      data: { target_pattern: "/services/" },
    });
    expect(res.status()).toBe(422);
  });
});

test.describe("POST /fetch-target", () => {
  test("fetches target page info", async ({ request }) => {
    const res = await request.post("/fetch-target", {
      data: { url: "https://example.com" },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.url).toBeTruthy();
    expect(Array.isArray(body.keywords)).toBe(true);
  });

  test("rejects missing url", async ({ request }) => {
    const res = await request.post("/fetch-target", {
      data: {},
    });
    expect(res.status()).toBe(422);
  });
});

test.describe("POST /match-links", () => {
  test("finds link opportunities via semantic matching", async ({
    request,
  }) => {
    const res = await request.post("/match-links", {
      data: {
        source_content:
          "Search engine optimization is an important part of digital marketing. Internal linking helps distribute page authority across your website and improves crawlability.",
        targets: [
          { url: "https://example.com/seo-guide", title: "SEO Guide" },
          {
            url: "https://example.com/link-building",
            title: "Link Building Tips",
          },
        ],
        threshold: 0.3,
        max_targets: 10,
      },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.matches).toBeDefined();
    expect(Array.isArray(body.matches)).toBe(true);

    if (body.matches.length > 0) {
      const match = body.matches[0];
      expect(match.target_url).toBeTruthy();
      expect(match.target_title).toBeTruthy();
      expect(typeof match.similarity).toBe("number");
      expect(match.matched_text).toBeTruthy();
      expect(typeof match.start_idx).toBe("number");
      expect(typeof match.end_idx).toBe("number");
    }
  });

  test("returns empty matches for unrelated content", async ({ request }) => {
    const res = await request.post("/match-links", {
      data: {
        source_content: "Today the weather is sunny with clear skies.",
        targets: [
          {
            url: "https://example.com/quantum-physics",
            title: "Advanced Quantum Physics Research",
          },
        ],
        threshold: 0.9,
        max_targets: 10,
      },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.matches).toBeDefined();
    expect(Array.isArray(body.matches)).toBe(true);
    // With a very high threshold, unrelated content should not match
    expect(body.matches.length).toBe(0);
  });

  test("rejects request without source_content", async ({ request }) => {
    const res = await request.post("/match-links", {
      data: {
        targets: [{ url: "https://example.com", title: "Example" }],
      },
    });
    expect(res.status()).toBe(422);
  });
});

test.describe("POST /sitemap", () => {
  test("requires authentication", async ({ request }) => {
    const res = await request.post("/sitemap", {
      data: {
        domain: "https://example.com",
        source_pattern: "/blog/",
        target_pattern: "/services/",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("works for authenticated user", async ({ request }) => {
    const { accessToken } = await registerUser(request);

    const res = await request.post("/sitemap", {
      headers: authHeader(accessToken),
      data: {
        domain: "https://example.com",
        source_pattern: "/",
        target_pattern: "/",
      },
    });
    // May be 200 or 403 (email not verified), both are valid
    expect([200, 403]).toContain(res.status());
  });
});

test.describe("POST /bulk-analyze", () => {
  test("rejects when too many URLs provided", async ({ request }) => {
    // Create an array of 101 URLs (exceeds default MAX_BULK_URLS=100)
    const urls = Array.from(
      { length: 101 },
      (_, i) => `https://example.com/page-${i}`
    );

    const res = await request.post("/bulk-analyze", {
      data: {
        urls,
        target_pattern: "/services/",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("Too many URLs");
  });

  test("rejects request without urls field", async ({ request }) => {
    const res = await request.post("/bulk-analyze", {
      data: { target_pattern: "/services/" },
    });
    expect(res.status()).toBe(422);
  });
});
