import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import { createUserActivityHandler } from "../controllers/admin.controller.js";

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
const SELLER_ID = "507f1f77bcf86cd799439033";

const noneFetch = async () => [];

const baseDeps = () => ({
  findUser: async () => ({ _id: VALID_ID }),
  fetchProducts: noneFetch,
  fetchQuoteRequests: noneFetch,
  fetchUnifiedQuotes: noneFetch,
  fetchDealQuotes: noneFetch,
  fetchSampleRequests: noneFetch,
  fetchBulkOrders: noneFetch,
  fetchSupplierOffers: noneFetch,
  fetchEnquiries: noneFetch,
  findUsersByIds: async () => [],
  findProductsByIds: async () => [],
  findChemicalFamiliesByIds: async () => [],
  findBestDealsByIds: async () => [],
  findBulkOrdersByIds: async () => [],
});

test("returns 400 for a malformed id", async () => {
  const handler = createUserActivityHandler({});
  const req = { params: { id: "bad-id" }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
});

test("returns 404 when no user matches the id", async () => {
  const handler = createUserActivityHandler({ ...baseDeps(), findUser: async () => null });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
});

test("merges sources across types in date-desc order", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchProducts: async () => [
      { _id: "p1", productName: "Old Product", createdAt: new Date("2024-01-01"), isArchived: false },
    ],
    fetchSampleRequests: async () => [
      { _id: "s1", status: "pending", createdAt: new Date("2024-06-01") },
    ],
    fetchBulkOrders: async () => [
      { _id: "b1", sellerStatus: "accepted", createdAt: new Date("2024-03-01") },
    ],
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const types = res.body.items.map((i) => i.type);
  assert.deepEqual(types, ["sample_request", "bulk_order", "product"]);
});

test("attributes buyer vs seller role and resolves counterparty for quote flows", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchQuoteRequests: async () => [
      {
        _id: "q1",
        buyerId: VALID_ID,
        sellerId: SELLER_ID,
        status: [{ status: "pending" }],
        createdAt: new Date("2024-05-01"),
      },
    ],
    fetchDealQuotes: async () => [
      {
        _id: "d1",
        buyerId: OTHER_ID,
        sellerId: VALID_ID,
        status: [{ status: "responded" }],
        createdAt: new Date("2024-05-02"),
      },
    ],
    findUsersByIds: async (ids) =>
      ids.map((id) => ({ _id: id, firstName: "Fake", lastName: "Co", company: `Company ${id}` })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const quoteItem = res.body.items.find((i) => i.type === "quote_request");
  const dealItem = res.body.items.find((i) => i.type === "deal_quote");

  assert.equal(quoteItem.role, "buyer");
  assert.equal(quoteItem.counterparty, `Company ${SELLER_ID}`);
  assert.equal(quoteItem.status, "pending");

  assert.equal(dealItem.role, "seller");
  assert.equal(dealItem.counterparty, `Company ${OTHER_ID}`);
  assert.equal(dealItem.status, "responded");
});

test("enquiry items derive date from the ObjectId and flag dateApprox", async () => {
  const id = new mongoose.Types.ObjectId();
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchEnquiries: async () => [{ _id: id, message: "hi" }],
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items.find((i) => i.type === "enquiry");
  assert.equal(item.dateApprox, true);
  assert.equal(new Date(item.date).getTime(), id.getTimestamp().getTime());
});

test("flags perSourceCapped when a source hits the 50-doc cap", async () => {
  const capped = Array.from({ length: 50 }, (_, i) => ({
    _id: `p${i}`,
    productName: `Product ${i}`,
    createdAt: new Date(2024, 0, i + 1),
    isArchived: false,
  }));
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchProducts: async () => capped,
  });
  const req = { params: { id: VALID_ID }, query: { limit: "50" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.meta.perSourceCapped, true);
});

test("does not flag perSourceCapped when no source hits the cap", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchProducts: async () => [
      { _id: "p1", productName: "X", createdAt: new Date(), isArchived: false },
    ],
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.meta.perSourceCapped, undefined);
});

test("paginates the merged feed", async () => {
  const products = Array.from({ length: 25 }, (_, i) => ({
    _id: `p${i}`,
    productName: `Product ${i}`,
    createdAt: new Date(2024, 0, i + 1),
    isArchived: false,
  }));
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchProducts: async () => products,
  });

  const page1Req = { params: { id: VALID_ID }, query: { page: "1", limit: "20" } };
  const page1Res = responseRecorder();
  await handler(page1Req, page1Res);

  const page2Req = { params: { id: VALID_ID }, query: { page: "2", limit: "20" } };
  const page2Res = responseRecorder();
  await handler(page2Req, page2Res);

  assert.equal(page1Res.body.items.length, 20);
  assert.equal(page1Res.body.meta.total, 25);
  assert.equal(page2Res.body.items.length, 5);
  // Most recent (Jan 25) should be first item on page 1.
  assert.equal(page1Res.body.items[0].id, "p24");
});

test("product item detail carries name/price/image/chemicalFamily and no _raw leak", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchProducts: async () => [
      {
        _id: "p1",
        productName: "PA6 Virgin",
        price: 1200,
        priceTerms: "negotiable",
        uom: "Metric Ton",
        availability: "In Stock",
        stock: 40,
        isArchived: false,
        chemicalFamily: "cf1",
        productImages: [{ fileUrl: "https://img/pa6.jpg" }],
        completionStatus: "complete",
        createdAt: new Date("2024-01-01"),
      },
    ],
    findChemicalFamiliesByIds: async (ids) => ids.map((id) => ({ _id: id, name: "Polyamide" })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items[0];
  assert.deepEqual(item.detail, {
    productName: "PA6 Virgin",
    price: 1200,
    priceTerms: "negotiable",
    uom: "Metric Ton",
    availability: "In Stock",
    stock: 40,
    isArchived: false,
    chemicalFamily: "Polyamide",
    image: "https://img/pa6.jpg",
    completionStatus: "complete",
  });
  assert.equal(item._raw, undefined);
});

test("quote_request detail resolves the populated product and a rich counterparty object", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchQuoteRequests: async () => [
      {
        _id: "q1",
        buyerId: VALID_ID,
        sellerId: SELLER_ID,
        productId: "prod1",
        desiredQuantity: 500,
        uom: "Kilogram",
        status: [{ status: "responded" }],
        sellerResponse: { quotedPrice: 999 },
        createdAt: new Date("2024-05-01"),
      },
    ],
    findProductsByIds: async (ids) => ids.map((id) => ({ _id: id, productName: "HDPE Grade A" })),
    findUsersByIds: async (ids) =>
      ids.map((id) => ({ _id: id, firstName: "Sam", lastName: "Seller", company: "Seller Co" })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items[0];
  assert.deepEqual(item.detail, {
    productName: "HDPE Grade A",
    quantity: 500,
    uom: "Kilogram",
    status: "responded",
    amount: 999,
    counterparty: { name: "Sam Seller", company: "Seller Co" },
  });
  // Top-level counterparty (display string) still resolves too.
  assert.equal(item.counterparty, "Seller Co");
});

test("sample_request detail resolves the seller counterparty via the product's createdBy", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchSampleRequests: async () => [
      { _id: "s1", product: "prod1", quantity: 10, status: "pending", createdAt: new Date("2024-06-01") },
    ],
    findProductsByIds: async (ids) =>
      ids.map((id) => ({ _id: id, productName: "PP Copolymer", createdBy: SELLER_ID })),
    findUsersByIds: async (ids) =>
      ids.map((id) => ({ _id: id, firstName: "Sam", lastName: "Seller", company: "Seller Co" })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items[0];
  assert.deepEqual(item.detail, {
    productName: "PP Copolymer",
    quantity: 10,
    status: "pending",
    counterparty: { name: "Sam Seller", company: "Seller Co" },
  });
});

test("deal_quote detail resolves productName via the BestDeal join", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchDealQuotes: async () => [
      {
        _id: "d1",
        buyerId: VALID_ID,
        sellerId: SELLER_ID,
        bestDealId: "bd1",
        desiredQuantity: 20,
        status: [{ status: "accepted" }],
        createdAt: new Date("2024-05-02"),
      },
    ],
    findBestDealsByIds: async (ids) => ids.map((id) => ({ _id: id, productId: "prod9", offerPrice: 50 })),
    findProductsByIds: async (ids) => ids.map((id) => ({ _id: id, productName: "Best Deal Resin" })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items[0];
  assert.equal(item.detail.productName, "Best Deal Resin");
  assert.equal(item.detail.amount, 50);
});

test("enquiry detail truncates the message to ~120 chars and resolves the product", async () => {
  const longMessage = "x".repeat(200);
  const id = new mongoose.Types.ObjectId();
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchEnquiries: async () => [{ _id: id, message: longMessage, product: "prod1" }],
    findProductsByIds: async (ids) => ids.map((pid) => ({ _id: pid, productName: "Enquiry Product" })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items.find((i) => i.type === "enquiry");
  assert.equal(item.detail.productName, "Enquiry Product");
  assert.equal(item.detail.message.length, 120);
  assert.equal(item.detail.status, null);
});

test("unified_quote deal-variant detail resolves productName via bestDealId->BestDeal->productId->Product and falls back to bestDeal.offerPrice when doc.price is absent", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchUnifiedQuotes: async () => [
      {
        _id: "u1",
        requestType: "deal_quote",
        buyerId: VALID_ID,
        sellerId: SELLER_ID,
        bestDealId: "bd1",
        desiredQuantity: 30,
        status: "pending",
        price: null, // no direct quoted price -> must fall back to bestDeal.offerPrice
        createdAt: new Date("2024-05-03"),
      },
    ],
    findBestDealsByIds: async (ids) => ids.map((id) => ({ _id: id, productId: "prod9", offerPrice: 77 })),
    findProductsByIds: async (ids) => ids.map((id) => ({ _id: id, productName: "Unified Deal Resin" })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items.find((i) => i.type === "unified_quote");
  assert.equal(item.title, "Deal quote request");
  assert.equal(item.detail.productName, "Unified Deal Resin");
  assert.equal(item.detail.amount, 77);
  assert.equal(item.detail.quantity, 30);
});

test("unified_quote deal-variant detail prefers doc.price over bestDeal.offerPrice when both are present", async () => {
  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchUnifiedQuotes: async () => [
      {
        _id: "u2",
        requestType: "deal_quote",
        buyerId: VALID_ID,
        sellerId: SELLER_ID,
        bestDealId: "bd1",
        desiredQuantity: 30,
        status: "pending",
        price: 123,
        createdAt: new Date("2024-05-03"),
      },
    ],
    findBestDealsByIds: async (ids) => ids.map((id) => ({ _id: id, productId: "prod9", offerPrice: 77 })),
    findProductsByIds: async (ids) => ids.map((id) => ({ _id: id, productName: "Unified Deal Resin" })),
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  const item = res.body.items.find((i) => i.type === "unified_quote");
  assert.equal(item.detail.amount, 123);
});

test("batches product/user lookups ONCE per page, not once per item", async () => {
  let productCalls = 0;
  let userCalls = 0;

  const handler = createUserActivityHandler({
    ...baseDeps(),
    fetchQuoteRequests: async () => [
      { _id: "q1", buyerId: VALID_ID, sellerId: "s1", productId: "prodA", status: [{ status: "pending" }], createdAt: new Date("2024-01-03") },
      { _id: "q2", buyerId: VALID_ID, sellerId: "s2", productId: "prodB", status: [{ status: "pending" }], createdAt: new Date("2024-01-02") },
    ],
    fetchSampleRequests: async () => [
      { _id: "sr1", product: "prodC", quantity: 5, status: "pending", createdAt: new Date("2024-01-01") },
    ],
    findProductsByIds: async (ids) => {
      productCalls += 1;
      return ids.map((id) => ({ _id: id, productName: `Product ${id}` }));
    },
    findUsersByIds: async (ids) => {
      userCalls += 1;
      return ids.map((id) => ({ _id: id, firstName: "F", lastName: "L", company: "Co" }));
    },
  });
  const req = { params: { id: VALID_ID }, query: {} };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(productCalls, 1, "findProductsByIds must be called once per page");
  assert.equal(userCalls, 1, "findUsersByIds must be called once per page");
  assert.equal(res.body.items.length, 3);
  assert.equal(res.body.items.find((i) => i.id === "q1").detail.productName, "Product prodA");
  assert.equal(res.body.items.find((i) => i.id === "q2").detail.productName, "Product prodB");
});
