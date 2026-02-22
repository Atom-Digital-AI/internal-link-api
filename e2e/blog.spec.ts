import { test, expect } from "@playwright/test";

const BLOG_API_KEY = process.env.BLOG_API_KEY || "test-blog-api-key";

test.describe("Blog — Public read endpoints", () => {
  test("GET /blog/posts returns a list", async ({ request }) => {
    const res = await request.get("/blog/posts");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /blog/posts/{nonexistent-slug} returns 404", async ({
    request,
  }) => {
    const res = await request.get("/blog/posts/this-slug-does-not-exist");
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body.detail).toContain("Post not found");
  });
});

test.describe("Blog — API key protected writes", () => {
  test("POST /blog/posts rejects request without API key", async ({
    request,
  }) => {
    const res = await request.post("/blog/posts", {
      data: {
        slug: "test-post",
        title: "Test Post",
        html_content: "<p>Hello</p>",
      },
    });
    expect(res.status()).toBe(403);
  });

  test("POST /blog/posts rejects request with wrong API key", async ({
    request,
  }) => {
    const res = await request.post("/blog/posts", {
      headers: { "X-API-Key": "wrong-key" },
      data: {
        slug: "test-post",
        title: "Test Post",
        html_content: "<p>Hello</p>",
      },
    });
    expect(res.status()).toBe(403);
  });

  test("PATCH /blog/posts/{slug} rejects without API key", async ({
    request,
  }) => {
    const res = await request.patch("/blog/posts/any-slug", {
      data: { title: "Updated Title" },
    });
    expect(res.status()).toBe(403);
  });

  test("DELETE /blog/posts/{slug} rejects without API key", async ({
    request,
  }) => {
    const res = await request.delete("/blog/posts/any-slug");
    expect(res.status()).toBe(403);
  });
});

test.describe("Blog — Full CRUD with API key", () => {
  const testSlug = `e2e-test-${Date.now()}`;

  test("creates, reads, updates, and deletes a blog post", async ({
    request,
  }) => {
    // Create
    const createRes = await request.post("/blog/posts", {
      headers: { "X-API-Key": BLOG_API_KEY },
      data: {
        slug: testSlug,
        title: "E2E Test Post",
        excerpt: "This is a test excerpt",
        html_content: "<p>Test content for E2E</p>",
        published: true,
      },
    });
    expect(createRes.status()).toBe(201);

    const created = await createRes.json();
    expect(created.slug).toBe(testSlug);
    expect(created.title).toBe("E2E Test Post");
    expect(created.excerpt).toBe("This is a test excerpt");
    expect(created.html_content).toBe("<p>Test content for E2E</p>");
    expect(created.published_at).toBeTruthy();
    expect(created.id).toBeTruthy();

    // Read (single post)
    const readRes = await request.get(`/blog/posts/${testSlug}`);
    expect(readRes.status()).toBe(200);

    const post = await readRes.json();
    expect(post.slug).toBe(testSlug);
    expect(post.title).toBe("E2E Test Post");
    expect(post.html_content).toBe("<p>Test content for E2E</p>");

    // Update
    const updateRes = await request.patch(`/blog/posts/${testSlug}`, {
      headers: { "X-API-Key": BLOG_API_KEY },
      data: {
        title: "Updated E2E Post",
        html_content: "<p>Updated content</p>",
      },
    });
    expect(updateRes.status()).toBe(200);

    const updated = await updateRes.json();
    expect(updated.title).toBe("Updated E2E Post");
    expect(updated.html_content).toBe("<p>Updated content</p>");
    expect(updated.slug).toBe(testSlug); // slug unchanged

    // Delete
    const deleteRes = await request.delete(`/blog/posts/${testSlug}`, {
      headers: { "X-API-Key": BLOG_API_KEY },
    });
    expect(deleteRes.status()).toBe(204);

    // Verify deleted
    const verifyRes = await request.get(`/blog/posts/${testSlug}`);
    expect(verifyRes.status()).toBe(404);
  });

  test("rejects duplicate slug on create", async ({ request }) => {
    const slug = `dup-test-${Date.now()}`;

    // Create first post
    const first = await request.post("/blog/posts", {
      headers: { "X-API-Key": BLOG_API_KEY },
      data: { slug, title: "First Post", html_content: "<p>First</p>" },
    });
    expect(first.status()).toBe(201);

    // Try to create with the same slug
    const second = await request.post("/blog/posts", {
      headers: { "X-API-Key": BLOG_API_KEY },
      data: { slug, title: "Duplicate Post", html_content: "<p>Dup</p>" },
    });
    expect(second.status()).toBe(409);
    const body = await second.json();
    expect(body.detail).toContain("slug already exists");

    // Cleanup
    await request.delete(`/blog/posts/${slug}`, {
      headers: { "X-API-Key": BLOG_API_KEY },
    });
  });

  test("unpublished posts are not visible in public list", async ({
    request,
  }) => {
    const slug = `unpub-test-${Date.now()}`;

    // Create unpublished post
    await request.post("/blog/posts", {
      headers: { "X-API-Key": BLOG_API_KEY },
      data: {
        slug,
        title: "Unpublished",
        html_content: "<p>Draft</p>",
        published: false,
      },
    });

    // Should not be visible in public GET by slug
    const res = await request.get(`/blog/posts/${slug}`);
    expect(res.status()).toBe(404);

    // Should not appear in list
    const listRes = await request.get("/blog/posts");
    const posts = await listRes.json();
    const found = posts.find((p: { slug: string }) => p.slug === slug);
    expect(found).toBeUndefined();

    // Cleanup
    await request.delete(`/blog/posts/${slug}`, {
      headers: { "X-API-Key": BLOG_API_KEY },
    });
  });
});
