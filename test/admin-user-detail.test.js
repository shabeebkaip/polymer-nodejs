import assert from "node:assert/strict";
import test from "node:test";
import { createUserDetailHandler } from "../controllers/admin.controller.js";

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
const OTHER_ID = "507f1f77bcf86cd799439022";

const makeUser = (overrides = {}) => ({
  _id: VALID_ID,
  email: "seller@example.com",
  user_type: "seller",
  company: "Some Co",
  firstName: "Shabeeb",
  lastName: "K",
  website: "https://example.com",
  location: "Dubai",
  address: "123 Industrial Ave",
  vat_number: "VAT123",
  industry: ["Automotive", "Packaging"],
  toObject() {
    const { toObject, ...rest } = this;
    return { ...rest };
  },
  ...overrides,
});

// Every test below reaches the Promise.all of counts + activity fetchers, so all of them
// must be injected (the defaults hit a real, unavailable DB in this unit-test env).
const baseDeps = (overrides = {}) => ({
  findUser: async () => makeUser(),
  countProductsCreated: async () => 5,
  countQuotesAsBuyer: async () => 2,
  countQuotesAsSeller: async () => 7,
  countSampleRequests: async () => 1,
  countBulkOrders: async () => 3,
  countSupplierOffers: async () => 4,
  countEnquiries: async () => 6,
  countProductsActive: async () => 9,
  countProductsArchived: async () => 2,
  fetchProducts: async () => [],
  fetchQuoteRequests: async () => [],
  fetchUnifiedQuotes: async () => [],
  fetchDealQuotes: async () => [],
  fetchSampleRequests: async () => [],
  fetchBulkOrders: async () => [],
  fetchSupplierOffers: async () => [],
  fetchEnquiries: async () => [],
  ...overrides,
});

test("returns user profile + activity counts for a valid id", async () => {
  const handler = createUserDetailHandler(baseDeps());
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.equal(res.body.user.email, "seller@example.com");
  assert.deepEqual(res.body.counts, {
    productsCreated: 5,
    quotesAsBuyer: 2,
    quotesAsSeller: 7,
    sampleRequests: 1,
    bulkOrders: 3,
    supplierOffers: 4,
    enquiries: 6,
    productsActive: 9,
    productsArchived: 2,
    quotesTotal: 9,
  });
});

test("profile includes createdAt (approximated from the id), name, and the full non-sensitive doc", async () => {
  const handler = createUserDetailHandler(baseDeps());
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.user.name, "Shabeeb K");
  assert.equal(res.body.user.website, "https://example.com");
  assert.equal(res.body.user.location, "Dubai");
  assert.equal(res.body.user.address, "123 Industrial Ave");
  assert.equal(res.body.user.vat_number, "VAT123");
  assert.deepEqual(res.body.user.industry, ["Automotive", "Packaging"]);
  assert.ok(res.body.user.createdAt);
  assert.equal(res.body.user.createdAtApprox, true);
  assert.equal(res.body.user.updatedAt, null);
});

test("insights: computed from counts + already-fetched activity, quoteAcceptanceRate for sellers", async () => {
  const handler = createUserDetailHandler(
    baseDeps({
      fetchProducts: async () => [{ _id: "p1", createdAt: new Date("2024-01-01") }],
      fetchQuoteRequests: async () => [
        { _id: "q1", sellerId: VALID_ID, buyerId: OTHER_ID, status: [{ status: "accepted" }], createdAt: new Date("2024-06-01") },
        { _id: "q2", sellerId: VALID_ID, buyerId: OTHER_ID, status: [{ status: "rejected" }], createdAt: new Date("2024-05-01") },
      ],
    })
  );
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.insights.activeListings, 9);
  assert.equal(res.body.insights.hasBuyerEngagement, true); // quotesAsBuyer:2 from baseDeps
  assert.equal(res.body.insights.quoteAcceptanceRate, 0.5);
  assert.equal(new Date(res.body.insights.lastActivityAt).getTime(), new Date("2024-06-01").getTime());
  assert.ok(res.body.insights.memberSince);
});

test("insights: quoteAcceptanceRate is null for buyers and when there's no seller-side quote history", async () => {
  const handler = createUserDetailHandler(
    baseDeps({ findUser: async () => makeUser({ user_type: "buyer" }) })
  );
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.insights.quoteAcceptanceRate, null);
});

test("insights: hasBuyerEngagement is false with no buyer-side activity", async () => {
  const handler = createUserDetailHandler(
    baseDeps({ countQuotesAsBuyer: async () => 0, countSampleRequests: async () => 0, countBulkOrders: async () => 0 })
  );
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.insights.hasBuyerEngagement, false);
});

test("returns 404 when no user matches the id", async () => {
  const handler = createUserDetailHandler({ findUser: async () => null });
  const req = { params: { id: VALID_ID } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.status, false);
});

test("returns 400 for a malformed id", async () => {
  const handler = createUserDetailHandler({});
  const req = { params: { id: "not-an-id" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /valid user id/i);
});
