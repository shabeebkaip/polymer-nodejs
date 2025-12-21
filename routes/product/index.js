import express from "express";
import productController from "../../controllers/product.controller.js";
import { authenticateUser, authorizeRoles } from "../../middlewares/verify.token.js";

const router = express.Router();

/**
 * Product Routes
 * Base path: /api/v1/product
 * 
 * Architecture: Controller -> Service -> Repository -> Model
 */

// ========================
// PUBLIC/BUYER ROUTES
// ========================

/**
 * @route   POST /api/v1/product/list
 * @desc    Get products with filtering and pagination
 * @access  Public
 * @body    {
 *            page: number,
 *            limit: number,
 *            search?: string,
 *            chemicalFamily?: string[],
 *            polymerType?: string[],
 *            industry?: string[],
 *            grade?: string[],
 *            physicalForm?: string[],
 *            countryOfOrigin?: string[],
 *            uom?: string[],
 *            priceTerms?: string,
 *            incoterms?: string[],
 *            paymentTerms?: string[],
 *            packagingType?: string[],
 *            recyclable?: boolean,
 *            bioDegradable?: boolean,
 *            fdaApproved?: boolean,
 *            medicalGrade?: boolean,
 *            company?: string[],
 *            createdBy?: string[],
 *            product_family?: string[]
 *          }
 */
router.post("/list", productController.list.bind(productController));

/**
 * @route   POST /api/v1/product/filter
 * @desc    Get filter options with counts for faceted search
 * @access  Public
 * @body    Current filters object (same structure as list filters)
 */
router.post("/filter", productController.getFilterOptions.bind(productController));

/**
 * @route   GET /api/v1/product/:id
 * @desc    Get a single product with full details
 * @access  Public
 * @params  id - Product ID
 */
router.get("/:id", productController.getById.bind(productController));

// ========================
// SELLER/ADMIN ROUTES
// ========================

/**
 * @route   POST /api/v1/product/create
 * @desc    Create a new product
 * @access  Seller, SuperAdmin
 * @body    Product data with optional "Other" handling for:
 *          - chemicalFamily (with otherChemicalFamily)
 *          - physicalForm (with otherPhysicalForm)
 *          - polymerType (with otherPolymerType)
 */
router.post(
  "/create",
  authenticateUser,
  authorizeRoles("seller", "superAdmin"),
  productController.create.bind(productController)
);

/**
 * @route   PUT /api/v1/product/:id
 * @desc    Update a product
 * @access  Seller, SuperAdmin
 * @params  id - Product ID
 * @body    Product update data with optional "Other" handling
 */
router.put(
  "/:id",
  authenticateUser,
  authorizeRoles("seller", "superAdmin"),
  productController.update.bind(productController)
);

/**
 * @route   DELETE /api/v1/product/:id
 * @desc    Delete a product (owner or admin only)
 * @access  Seller, SuperAdmin
 * @params  id - Product ID
 */
router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("seller", "superAdmin"),
  productController.delete.bind(productController)
);

export default router;
