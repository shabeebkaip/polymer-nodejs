import assert from "node:assert/strict";
import test from "node:test";
import {
  PROCESSING_STAGES,
  createGetParseSessionHandler,
  createParseUploadHandler,
  createPipelineRunner,
} from "../controllers/ai.controller.js";

const file = {
  name: "catalogue.pdf",
  mimetype: "application/pdf",
  data: Buffer.from("catalogue"),
};

const extracted = {
  format: "pdf",
  text: "Polypropylene grade PP-01",
  extractionMethod: "text",
};

const polymerResult = {
  extraction: {
    isPolymerCatalog: true,
    products: [
      { productName: { value: "PP-01", confidence: "high", source: null } },
    ],
  },
  model: "test-model",
  usage: { inputTokens: 10, outputTokens: 5 },
};

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

test("successful pipeline persists real stages in boundary order", async () => {
  const patches = [];
  const runner = createPipelineRunner({
    extractUpload: async () => extracted,
    parse: async () => polymerResult,
    resolve: async () => ({ polymerType: { tier: "auto" } }),
    persist: async (_sessionId, patch) => {
      patches.push(patch);
      return patch;
    },
    logger: { error() {} },
  });

  await runner("ses_success", file);

  assert.deepEqual(
    patches.map((patch) => patch.stage ?? patch.status),
    ["extracting", "analysing", "matching", "preparing", "completed"]
  );
  assert.equal(patches.at(-1).stage, undefined);
  assert.equal(patches.at(-1).products[0].product.productName.value, "PP-01");
});

test("failure retains the last real stage and never invents later stages", async () => {
  const patches = [];
  const runner = createPipelineRunner({
    extractUpload: async () => extracted,
    parse: async () => polymerResult,
    resolve: async () => {
      throw new Error("reference database unavailable");
    },
    persist: async (_sessionId, patch) => {
      patches.push(patch);
      return patch;
    },
    logger: { error() {} },
  });

  await runner("ses_failure", file);

  assert.deepEqual(
    patches.map((patch) => patch.stage ?? patch.status),
    ["extracting", "analysing", "matching", "failed"]
  );
  assert.equal(patches.some((patch) => patch.stage === "preparing"), false);
  assert.equal(patches.at(-1).failureCode, "error");
  assert.equal(patches.at(-1).errorMessage, "Processing failed.");
  assert.equal(JSON.stringify(patches.at(-1)).includes("reference database"), false);
});

test("a non-polymer result completes without claiming matching or preparing", async () => {
  const patches = [];
  const runner = createPipelineRunner({
    extractUpload: async () => extracted,
    parse: async () => ({
      extraction: {
        isPolymerCatalog: false,
        products: [],
        rejectionReason: "No polymer catalogue data",
      },
    }),
    resolve: async () => {
      assert.fail("reference matching must not run for rejected documents");
    },
    persist: async (_sessionId, patch) => {
      patches.push(patch);
      return patch;
    },
    logger: { error() {} },
  });

  await runner("ses_rejected", file);

  assert.deepEqual(
    patches.map((patch) => patch.stage ?? patch.status),
    ["extracting", "analysing", "completed"]
  );
  assert.deepEqual(patches.at(-1).products, []);
  assert.equal(patches.at(-1).rejectionReason, "No polymer catalogue data");
});

test("accepted upload creates and returns the additive uploaded stage", async () => {
  const created = [];
  const scheduled = [];
  const unlinked = [];
  const pipelineCalls = [];
  const handler = createParseUploadHandler({
    readFile: async () => Buffer.from("pdf"),
    unlink: async (path) => unlinked.push(path),
    create: async (payload) => {
      created.push(payload);
      return "ses_uploaded";
    },
    schedule: (task) => scheduled.push(task),
    pipeline: (...args) => pipelineCalls.push(args),
  });
  const req = {
    files: {
      file: {
        name: "catalogue.pdf",
        mimetype: "application/pdf",
        size: 3,
        tempFilePath: "/tmp/catalogue.pdf",
      },
    },
    user: { id: { toString: () => "seller-1" } },
  };
  const res = responseRecorder();

  await handler(req, res, (error) => assert.fail(error));

  assert.deepEqual(created, [{
    userId: "seller-1",
    sourceFile: "catalogue.pdf",
    status: "processing",
    stage: PROCESSING_STAGES.UPLOADED,
  }]);
  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body, {
    success: true,
    sessionId: "ses_uploaded",
    status: "processing",
    stage: "uploaded",
  });
  assert.equal(pipelineCalls.length, 0);
  assert.equal(scheduled.length, 1);
  scheduled[0]();
  assert.equal(pipelineCalls.length, 1);
  assert.deepEqual(unlinked, ["/tmp/catalogue.pdf"]);
});

test("legacy stage-less session remains readable and ownership remains private", async () => {
  const handler = createGetParseSessionHandler({
    load: async () => ({
      userId: "seller-1",
      sourceFile: "legacy.pdf",
      status: "processing",
      createdAt: 1_700_000_000_000,
    }),
  });
  const req = {
    params: { id: "ses_legacy" },
    user: { id: { toString: () => "seller-1" } },
  };
  const res = responseRecorder();

  await handler(req, res, (error) => assert.fail(error));

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    sessionId: "ses_legacy",
    sourceFile: "legacy.pdf",
    status: "processing",
    createdAt: 1_700_000_000_000,
  });
  assert.equal("stage" in res.body, false);
  assert.equal("userId" in res.body, false);
});

test("session endpoint exposes a known stage without changing status semantics", async () => {
  const handler = createGetParseSessionHandler({
    load: async () => ({
      userId: "seller-1",
      sourceFile: "catalogue.pdf",
      status: "processing",
      stage: "analysing",
    }),
  });
  const req = {
    params: { id: "ses_stage" },
    user: { id: { toString: () => "seller-1" } },
  };
  const res = responseRecorder();

  await handler(req, res, (error) => assert.fail(error));

  assert.equal(res.body.status, "processing");
  assert.equal(res.body.stage, "analysing");
});

test("session endpoint preserves not-found and ownership guards", async () => {
  const missingHandler = createGetParseSessionHandler({ load: async () => null });
  const missingResponse = responseRecorder();
  await missingHandler(
    { params: { id: "ses_missing" }, user: { id: { toString: () => "seller-1" } } },
    missingResponse,
    (error) => assert.fail(error)
  );
  assert.equal(missingResponse.statusCode, 404);
  assert.deepEqual(missingResponse.body, {
    success: false,
    message: "Session not found or expired.",
  });

  const forbiddenHandler = createGetParseSessionHandler({
    load: async () => ({ userId: "seller-2", status: "processing", stage: "matching" }),
  });
  const forbiddenResponse = responseRecorder();
  await forbiddenHandler(
    { params: { id: "ses_private" }, user: { id: { toString: () => "seller-1" } } },
    forbiddenResponse,
    (error) => assert.fail(error)
  );
  assert.equal(forbiddenResponse.statusCode, 403);
  assert.deepEqual(forbiddenResponse.body, {
    success: false,
    message: "Access denied.",
  });
});
