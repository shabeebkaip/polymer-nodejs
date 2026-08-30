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
    restoreListings: async () => ({ modifiedCount: 0 }),
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

test("buyer -> seller succeeds without company in the request when the account already has one on file (one-click convert)", async () => {
  const user = makeUser({ company: "Existing Co On File" });
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    restoreListings: async () => ({ modifiedCount: 0 }),
  });
  const req = { body: { email: "buyer@example.com", user_type: "seller" } }; // no company in payload
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.equal(res.body.data.user_type, "seller");
  assert.equal(res.body.data.company, "Existing Co On File", "existing company must be left untouched");
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
  assert.equal(res.body.alreadyConverted, true);
  assert.match(res.body.message, /already a seller/i);
});

test("seller -> buyer archives the seller's live listings instead of blocking", async () => {
  const user = makeUser({ user_type: "seller", company: "Some Seller Co" });
  let archivedFor = null;
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    archiveListings: async (sellerId) => {
      archivedFor = sellerId;
      return { modifiedCount: 3 };
    },
  });
  const req = { body: { email: "seller@example.com", user_type: "buyer" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, true);
  assert.equal(res.body.data.user_type, "buyer");
  assert.equal(res.body.archivedCount, 3);
  assert.equal(archivedFor, user._id, "archive must target the demoted seller");
});

test("seller -> buyer with no listings converts and archives zero", async () => {
  const user = makeUser({ user_type: "seller", company: "Some Seller Co" });
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    archiveListings: async () => ({ modifiedCount: 0 }),
  });
  const req = { body: { email: "seller@example.com", user_type: "buyer" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.user_type, "buyer");
  assert.equal(res.body.archivedCount, 0);
});

test("buyer -> seller restores listings archived by a prior role change", async () => {
  const user = makeUser({ user_type: "buyer", company: "Returning Seller Co" });
  let restoredFor = null;
  const handler = createConvertRoleHandler({
    findUser: async () => user,
    restoreListings: async (sellerId) => {
      restoredFor = sellerId;
      return { modifiedCount: 2 };
    },
  });
  const req = { body: { email: "buyer@example.com", user_type: "seller" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.user_type, "seller");
  assert.equal(res.body.restoredCount, 2);
  assert.equal(restoredFor, user._id, "restore must target the re-promoted account");
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
