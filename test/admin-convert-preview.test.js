import assert from "node:assert/strict";
import test from "node:test";
import { createConvertPreviewHandler } from "../controllers/admin.controller.js";

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

test("seller -> buyer preview reports the listings that will be archived", async () => {
  const handler = createConvertPreviewHandler({
    findUser: async () => ({ _id: VALID_ID, user_type: "seller", company: "Seller Co" }),
    countActiveListings: async () => 4,
  });
  const req = { params: { id: VALID_ID }, query: { to: "buyer" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.isNoop, false);
  assert.equal(res.body.counts.activeListings, 4);
  assert.ok(res.body.consequences.some((c) => /4 active product listing/i.test(c)));
  assert.ok(res.body.consequences.some((c) => /restored if this account is converted back/i.test(c)));
});

test("seller -> buyer preview with no listings says nothing will be archived", async () => {
  const handler = createConvertPreviewHandler({
    findUser: async () => ({ _id: VALID_ID, user_type: "seller", company: "Seller Co" }),
    countActiveListings: async () => 0,
  });
  const req = { params: { id: VALID_ID }, query: { to: "buyer" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.counts.activeListings, 0);
  assert.ok(res.body.consequences.some((c) => /no active listings/i.test(c)));
});

test("buyer -> seller preview flags a required company when none on file", async () => {
  const handler = createConvertPreviewHandler({
    findUser: async () => ({ _id: VALID_ID, user_type: "buyer", company: "" }),
    countArchivedFromRoleChange: async () => 0,
  });
  const req = { params: { id: VALID_ID }, query: { to: "seller" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.requiresCompany, true);
  assert.equal(res.body.hasCompany, false);
  assert.ok(res.body.consequences.some((c) => /company name is required/i.test(c)));
});

test("buyer -> seller preview reports listings that will be restored", async () => {
  const handler = createConvertPreviewHandler({
    findUser: async () => ({ _id: VALID_ID, user_type: "buyer", company: "Returning Co" }),
    countArchivedFromRoleChange: async () => 2,
  });
  const req = { params: { id: VALID_ID }, query: { to: "seller" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.requiresCompany, false);
  assert.equal(res.body.counts.archivedFromRoleChange, 2);
  assert.ok(res.body.consequences.some((c) => /2 previously archived listing/i.test(c)));
});

test("same-role preview is a no-op", async () => {
  const handler = createConvertPreviewHandler({
    findUser: async () => ({ _id: VALID_ID, user_type: "buyer", company: "" }),
  });
  const req = { params: { id: VALID_ID }, query: { to: "buyer" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.body.isNoop, true);
  assert.ok(res.body.consequences[0].match(/already a buyer/i));
});

test("preview rejects an invalid target role", async () => {
  const handler = createConvertPreviewHandler({ findUser: async () => ({}) });
  const req = { params: { id: VALID_ID }, query: { to: "admin" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /must be 'buyer' or 'seller'/i);
});

test("preview rejects a malformed user id", async () => {
  const handler = createConvertPreviewHandler({});
  const req = { params: { id: "not-an-id" }, query: { to: "seller" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /valid user id/i);
});

test("preview returns 404 when the account is missing", async () => {
  const handler = createConvertPreviewHandler({ findUser: async () => null });
  const req = { params: { id: VALID_ID }, query: { to: "seller" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
});
