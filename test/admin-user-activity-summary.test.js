import assert from "node:assert/strict";
import test from "node:test";
import { createUserActivitySummaryHandler } from "../controllers/admin.controller.js";

const responseRecorder = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const VALID_ID = "507f1f77bcf86cd799439011";

const baseDeps = (overrides = {}) => ({
  findUser: async () => ({ _id: VALID_ID, user_type: "seller", company: "Acme Polymers" }),
  getCounts: async () => ({
    productsCreated: 5,
    quotesAsBuyer: 0,
    quotesAsSeller: 3,
    sampleRequests: 1,
    bulkOrders: 0,
    supplierOffers: 0,
    enquiries: 0,
  }),
  getRecentActivity: async () => [{ type: "product", title: "Created product: PA6", date: new Date() }],
  generateSummary: async () => "Acme Polymers is an active seller with 5 product listings and 3 quotes received.",
  ...overrides,
});

test("returns an AI-generated summary for a valid id", async () => {
  const handler = createUserActivitySummaryHandler(baseDeps());
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.match(res.body.summary, /Acme Polymers/);
});

test("returns 404 when no user matches the id", async () => {
  const handler = createUserActivitySummaryHandler(baseDeps({ findUser: async () => null }));
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.status, false);
});

test("returns 400 for a malformed id", async () => {
  const handler = createUserActivitySummaryHandler(baseDeps());
  const req = { params: { id: "not-an-id" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /valid user id/i);
});

test("falls back to a deterministic non-AI summary when the LLM call fails, never 500s", async () => {
  const handler = createUserActivitySummaryHandler(
    baseDeps({
      generateSummary: async () => {
        throw new Error("rate limited");
      },
    })
  );
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.match(res.body.summary, /seller/i);
  assert.match(res.body.summary, /5 product listing/);
  // No API key or stack trace should ever leak into the fallback text.
  assert.doesNotMatch(res.body.summary, /ANTHROPIC_API_KEY/);
});

test("fallback summary says 'no recorded activity' when all counts are zero", async () => {
  const handler = createUserActivitySummaryHandler(
    baseDeps({
      getCounts: async () => ({
        productsCreated: 0,
        quotesAsBuyer: 0,
        quotesAsSeller: 0,
        sampleRequests: 0,
        bulkOrders: 0,
        supplierOffers: 0,
        enquiries: 0,
      }),
      generateSummary: async () => {
        throw new Error("timeout");
      },
    })
  );
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.summary, /no recorded activity/i);
});
