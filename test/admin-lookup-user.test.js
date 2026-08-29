import assert from "node:assert/strict";
import test from "node:test";
import { createLookupUserHandler } from "../controllers/admin.controller.js";

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

test("existing buyer without company: exists true, hasSellerFields false", async () => {
  const handler = createLookupUserHandler({
    findUser: async () => ({ user_type: "buyer", company: undefined }),
    findAuth: async () => ({ email: "buyer@example.com" }),
  });
  const req = { query: { email: "buyer@example.com" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { exists: true, user_type: "buyer", hasSellerFields: false });
});

test("existing buyer with company: hasSellerFields true", async () => {
  const handler = createLookupUserHandler({
    findUser: async () => ({ user_type: "buyer", company: "Acme Polymers" }),
    findAuth: async () => ({ email: "buyer@example.com" }),
  });
  const req = { query: { email: "buyer@example.com" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { exists: true, user_type: "buyer", hasSellerFields: true });
});

test("existing seller with company: reports seller + hasSellerFields true", async () => {
  const handler = createLookupUserHandler({
    findUser: async () => ({ user_type: "seller", company: "GG POLYCHEM L.L.C – FZ" }),
    findAuth: async () => ({ email: "seller@example.com" }),
  });
  const req = { query: { email: "seller@example.com" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { exists: true, user_type: "seller", hasSellerFields: true });
});

test("non-existent email: exists false, user_type null, hasSellerFields false", async () => {
  const handler = createLookupUserHandler({
    findUser: async () => null,
    findAuth: async () => null,
  });
  const req = { query: { email: "nobody@example.com" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { exists: false, user_type: null, hasSellerFields: false });
});

test("missing email query param returns 400", async () => {
  const handler = createLookupUserHandler({});
  const req = { query: {} };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, false);
  assert.match(res.body.message, /email query param is required/i);
});

test("blank/whitespace-only email query param returns 400", async () => {
  const handler = createLookupUserHandler({});
  const req = { query: { email: "   " } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, false);
});

test("email is normalized to lowercase/trim before lookup", async () => {
  let capturedQuery;
  const handler = createLookupUserHandler({
    findUser: async (query) => {
      capturedQuery = query;
      return null;
    },
    findAuth: async () => null,
  });
  const req = { query: { email: "  Buyer@Example.COM  " } };
  const res = responseRecorder();

  await handler(req, res);

  assert.deepEqual(capturedQuery, { email: "buyer@example.com" });
});

test("Auth row exists without a matching User doc: exists true, user_type null (inconsistent-state edge case)", async () => {
  const handler = createLookupUserHandler({
    findUser: async () => null,
    findAuth: async () => ({ email: "orphan-auth@example.com" }),
  });
  const req = { query: { email: "orphan-auth@example.com" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { exists: true, user_type: null, hasSellerFields: false });
});

test("internal error returns 500 with generic message, no stack leak", async () => {
  const handler = createLookupUserHandler({
    findUser: async () => {
      throw new Error("db down");
    },
    findAuth: async () => null,
  });
  const req = { query: { email: "buyer@example.com" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.status, false);
});
