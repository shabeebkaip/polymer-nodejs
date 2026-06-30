import Fuse from "fuse.js";
import mongoose from "mongoose";

const REF_COLLECTIONS = {
  polymerType: "polymertypes",
  chemicalFamily: "chemicalfamilies",
  industry: "industries",
  grade: "grades",
  physicalForm: "physicalforms",
  productFamily: "productfamilies",
};

const CACHE_TTL_MS = 5 * 60 * 1000;
// ponytail: cache fuse instances alongside items to avoid rebuilding per call
const cache = new Map();

const fuseOptions = {
  includeScore: true,
  threshold: 0.45,
  keys: ["name", "slug", "aliases"],
};

const loadCollection = async (collectionName) => {
  const cached = cache.get(collectionName);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached;
  }

  const db = mongoose.connection.db;
  if (!db) throw new Error("Mongo not connected");
  const items = await db
    .collection(collectionName)
    .find({}, { projection: { _id: 1, name: 1, slug: 1, aliases: 1 } })
    .toArray();

  const entry = { items, fuse: new Fuse(items, fuseOptions), loadedAt: Date.now() };
  cache.set(collectionName, entry);
  return entry;
};

const SCORE_TIERS = { autoLink: 0.3, confirm: 0.55 };

const tierFor = (score) => {
  if (score <= SCORE_TIERS.autoLink) return "auto";
  if (score <= SCORE_TIERS.confirm) return "confirm";
  return "manual";
};

export const matchOne = async (refKey, query) => {
  if (!query || typeof query !== "string") return null;
  const collection = REF_COLLECTIONS[refKey];
  if (!collection) return null;

  const { fuse, items } = await loadCollection(collection);
  if (items.length === 0) return null;

  const [best] = fuse.search(query, { limit: 1 });
  if (!best) return { query, tier: "manual", match: null, score: 1 };

  return {
    query,
    tier: tierFor(best.score ?? 1),
    score: best.score,
    match: { _id: best.item._id, name: best.item.name, slug: best.item.slug },
  };
};

// unwraps ConfidentEnum/ConfidentString wrappers so matchOne always receives a plain string
const strVal = (field) => (field && typeof field === "object" ? field.value : field);

export const resolveReferences = async (extractedProduct) => {
  const results = {};

  results.polymerType = await matchOne("polymerType", strVal(extractedProduct.polymerType));
  results.chemicalFamily = await matchOne("chemicalFamily", strVal(extractedProduct.chemicalFamily));
  results.physicalForm = await matchOne("physicalForm", strVal(extractedProduct.physicalForm));

  if (Array.isArray(extractedProduct.industry)) {
    results.industry = await Promise.all(
      extractedProduct.industry.map((v) => matchOne("industry", strVal(v)))
    );
  }

  if (Array.isArray(extractedProduct.grade)) {
    results.grade = await Promise.all(
      extractedProduct.grade.map((v) => matchOne("grade", strVal(v)))
    );
  }

  return results;
};
