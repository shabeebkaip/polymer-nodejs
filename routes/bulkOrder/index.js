import express from "express";
import bulkOrderController from "../../controllers/bulkOrder.controller.js";
import supplierOfferController from "../../controllers/supplierOffer.controller.js";
import { authenticateUser, authorizeRoles } from "../../middlewares/verify.token.js";

const router = express.Router();

/**
 * Bulk Order Routes
 *
 * POST   /bulk-order/create              - Create bulk order (authenticated)
 * GET    /bulk-order/admin-list          - Get all bulk orders (admin)
 * GET    /bulk-order/admin-list/:id      - Get bulk order detail (admin)
 * GET    /bulk-order/user-list           - Get user's bulk orders (authenticated)
 * GET    /bulk-order/user-list/:id       - Get user's bulk order detail (authenticated)
 * PATCH  /bulk-order/verify-status/:id   - Update bulk order status (admin)
 * PUT    /bulk-order/admin-edit/:id      - Update bulk order (admin)
 * POST   /bulk-order/admin-create        - Admin create bulk order
 * GET    /bulk-order/admin-approved      - Get approved bulk orders (public)
 *
 * Supplier Offer Routes
 * POST   /bulk-order/supplier-offer/create                   - Create supplier offer (authenticated)
 * GET    /bulk-order/supplier-offer/buyer/:bulkOrderId       - Get offers for bulk order (buyer)
 * GET    /bulk-order/supplier-offer/approved/:bulkOrderId    - Get approved suppliers
 * GET    /bulk-order/supplier-offer/supplier-history         - Get supplier's offer history (authenticated)
 * GET    /bulk-order/supplier-offer/detail/:bulkOrderId      - Get supplier offer detail (authenticated)
 * PATCH  /bulk-order/supplier-offer/verify/:offerId          - Verify offer (buyer)
 * GET    /bulk-order/supplier-offer/admin                    - Get all offers (admin)
 */

// Public routes
router.get("/admin-approved", bulkOrderController.getApprovedOrders);

// Authenticated user routes
router.post("/create", authenticateUser, bulkOrderController.create);
router.get("/user-list", authenticateUser, bulkOrderController.getUserOrders);
router.get("/user-list/:id", authenticateUser, bulkOrderController.getOrderDetail);

// Supplier Offer routes - Authenticated
router.post("/supplier-offer/create", authenticateUser, supplierOfferController.createSupplierOffer);
router.get("/supplier-offer/buyer/:bulkOrderId", authenticateUser, supplierOfferController.getBuyerSupplierOffers);
router.get("/supplier-offer/approved/:bulkOrderId", authenticateUser, supplierOfferController.getApprovedSuppliers);
router.get("/supplier-offer/supplier-history", authenticateUser, supplierOfferController.getSupplierHistory);
router.get("/supplier-offer/detail/:bulkOrderId", authenticateUser, supplierOfferController.getSupplierOfferDetail);
router.patch("/supplier-offer/verify/:offerId", authenticateUser, supplierOfferController.verifySupplierOfferBuyer);

// Supplier Offer routes - Admin
router.get(
  "/supplier-offer/admin",
  authenticateUser,
  authorizeRoles("superAdmin"),
  supplierOfferController.getAdminSupplierOffers
);

// Admin routes
router.get(
  "/admin-list",
  authenticateUser,
  authorizeRoles("superAdmin"),
  bulkOrderController.getAdminOrders
);
router.get(
  "/admin-list/:id",
  authenticateUser,
  authorizeRoles("superAdmin"),
  bulkOrderController.getOrderDetail
);
router.patch(
  "/verify-status/:id",
  authenticateUser,
  authorizeRoles("superAdmin"),
  bulkOrderController.updateStatus
);
router.put(
  "/admin-edit/:id",
  authenticateUser,
  authorizeRoles("superAdmin"),
  bulkOrderController.updateOrder
);
router.post(
  "/admin-create",
  authenticateUser,
  authorizeRoles("superAdmin"),
  bulkOrderController.create
);

export default router;
