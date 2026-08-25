import assert from "node:assert/strict";
import test from "node:test";
import { createConvertRoleHandler } from "../controllers/admin.controller.js";

const responseRecorder = () => {
  const response = {
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
  };
  return response;
};

const makeUser = (overrides = {}) => ({
  _id: "user_1",
  email: "buyer@example.com",
  user_type: "buyer",
  company: undefined,
  vat_number: undefined,
  website: undefined,
  verification: "approved",
  save: async function () {
    return this;
  },
  ...overrides,
});

test("buyer -> seller succeeds when company is provided", async () => {
  const user = makeUser();
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    countActiveListings: async () => 0,
  });
  const req = { body: { email: "buyer@example.com", user_type: "seller", company: "GG POLYCHEM L.L.C – FZ" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.equal(res.body.data.user_type, "seller");
  assert.equal(res.body.data.company, "GG POLYCHEM L.L.C – FZ");
  assert.equal(user.verification, "pending");
});

test("buyer -> seller rejected with 400 when company is missing", async () => {
  const user = makeUser();
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    countActiveListings: async () => 0,
  });
  const req = { body: { email: "buyer@example.com", user_type: "seller" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, false);
  assert.match(res.body.message, /company is required/i);
  assert.equal(user.user_type, "buyer", "user_type must not change on rejection");
});

test("converting to the same role is an idempotent no-op", async () => {
  const user = makeUser({ user_type: "seller", company: "Already Seller Co" });
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    countActiveListings: async () => 0,
  });
  const req = { body: { email: "seller@example.com", user_type: "seller" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.match(res.body.message, /already a seller/i);
});

test("seller -> buyer demotion is blocked when active listings exist", async () => {
  const user = makeUser({ user_type: "seller", company: "Some Seller Co" });
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    countActiveListings: async () => 3,
  });
  const req = { body: { email: "seller@example.com", user_type: "buyer" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.status, false);
  assert.match(res.body.message, /active product listing/i);
  assert.equal(user.user_type, "seller", "user_type must not change when blocked");
});

test("seller -> buyer demotion succeeds when there are no active listings", async () => {
  const user = makeUser({ user_type: "seller", company: "Some Seller Co" });
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    countActiveListings: async () => 0,
  });
  const req = { body: { email: "seller@example.com", user_type: "buyer" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.equal(res.body.data.user_type, "buyer");
});

test("returns 404 when no account matches the email/userId", async () => {
  const handler = createConvertRoleHandler({
    findUser: async () => null,
    countActiveListings: async () => 0,
  });
  const req = { body: { email: "nobody@example.com", user_type: "seller", company: "X" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.status, false);
});

test("returns 400 when neither email nor userId is provided", async () => {
  const handler = createConvertRoleHandler({});
  const req = { body: { user_type: "seller", company: "X" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /email or userId/i);
});

test("returns 400 for an invalid user_type", async () => {
  const handler = createConvertRoleHandler({});
  const req = { body: { email: "a@b.com", user_type: "superAdmin" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /user_type must be/i);
});

test("returns 400 for a malformed userId", async () => {
  const handler = createConvertRoleHandler({});
  const req = { body: { userId: "not-an-object-id", user_type: "seller", company: "X" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /not a valid id/i);
});
