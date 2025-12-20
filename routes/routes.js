import express from "express";

// ==================== CORE ROUTES ====================
import fileRouter from "./files/file.js";
import fileViewRouter from "./files/view.js";
import authRouter from "./auth/auth.js";
import userRouter from "./user/user.js";
import adminRouter from "./admins/admin.js";
import notificationRouter from "./notification/notification.js";
import dashboardRouter from "./dashboard/index.js";

// ==================== CATALOG ROUTES ====================
import categoryRouter from "./category/category.js";
import subCategoryRouter from "./subCategory/subCategory.js";
import brandRouter from "./brand/brand.js";
import productRouter from "./product/product.js";
import chemicalFamilyRouter from "./chemicalFamily/chemicalFamily.js";
import industryRouter from "./industry/industry.js";
import productFamilyRouter from "./productFamily/productFamily.js";
import appearanceRouter from "./appearance/appearance.js";
import substanceRouter from "./substance/substance.js";
import gradeRouter from "./grade/grade.js";
import physicalFormRouter from "./physicalForm/physicalForm.js";
import polymerTypeRouter from "./polymerType/polimerType.js";
import packagingTypeRouter from "./packagingType/packagingType.js";

// ==================== TRANSACTION ROUTES ====================
import incotermRouter from "./incoterm/incoterm.js";
import paymentTermsRouter from "./paymentTerms/paymentTerms.js";
import shippingMethodRouter from "./shippingMethod/shippingMethod.js";
import financeRouter from "./finance/finance.js";

// ==================== LEGACY QUOTE ROUTES ====================
import requestRouter from "./request/request.js";
import sampleRequestRouter from "./request/api/sample.js";
import sampleRouter from "./sampleRequest/sampleRequest.js";
import quoteRouter from "./quoteRequest/quoteRequest.js";
import unifiedQuoteRoutes from "./quote/api/unifiedQuotes.js";

// ==================== NEW ARCHITECTURE ROUTES ====================
// Deal Quote Request (New Architecture)
import dealQuoteRequestRouter from "./dealQuoteRequest/dealQuoteRequest.js";
import dealQuoteCommentRouter from "./dealQuoteComment/dealQuoteComment.js";

// Product Quote Request (New Architecture)
import productQuotesRouter from "./quoteRequest/api/productQuotes.js";
import quoteCommentRouter from "./quoteRequest/api/quoteComments.js";

// Sample Request (New Architecture)
import sampleRequestNewRouter from "./sampleRequest/sampleRequestNew.js";
import sampleRequestCommentRouter from "./sampleRequestComment/sampleRequestComment.js";

// ==================== CUSTOMER ENGAGEMENT ROUTES ====================
import enquiryRouter from "./enquiry/enquiry.js";
import cartRouter from "./cart/cart.js";
import chatRouter from "./chat/chat.js";
import bestDealRouter from "./bestDeal/bestDeal.js";
import bulkOrderRouter from "./bulkOrder/bulkOrder.js";

// ==================== CMS & CONTENT ROUTES ====================
import cmsRouter from "./cms/cms.js";
import homeRouter from "./home/home.js";

// ==================== TEST ROUTES ====================
import testEmailRouter from "./test/testEmail.js";

// import testimonialRoutes from "./testimonials/testimonials.js";

const router = express.Router();

// ==================== CORE ROUTES ====================
router.use("/file", fileRouter);
router.use("/files", fileViewRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/notifications", notificationRouter);
router.use("/dashboard", dashboardRouter);

// ==================== CATALOG ROUTES ====================
router.use("/category", categoryRouter);
router.use("/sub-category", subCategoryRouter);
router.use("/brand", brandRouter);
router.use("/product", productRouter);
router.use("/chemical-family", chemicalFamilyRouter);
router.use("/industry", industryRouter);
router.use("/product-family", productFamilyRouter);
router.use("/appearance", appearanceRouter);
router.use("/substance", substanceRouter);
router.use("/grade", gradeRouter);
router.use("/physical-form", physicalFormRouter);
router.use("/packaging-type", packagingTypeRouter);
router.use("/polymer-type", polymerTypeRouter);

// ==================== TRANSACTION ROUTES ====================
router.use("/incoterm", incotermRouter);
router.use("/payment-terms", paymentTermsRouter);
router.use("/shipping-method", shippingMethodRouter);
router.use("/finance", financeRouter);

// ==================== LEGACY QUOTE ROUTES ====================
router.use("/request", requestRouter);
router.use("/sample-request", sampleRouter); // Legacy sample request routes
router.use("/quote-request", quoteRouter); // Legacy quote request routes
router.use("/quote", unifiedQuoteRoutes); // Legacy unified quote routes

// ==================== NEW ARCHITECTURE ROUTES ====================
// Deal Quote Request (Model-Repository-Service-Controller)
router.use("/deal-quote-request", dealQuoteRequestRouter);
router.use("/deal-quote-comment", dealQuoteCommentRouter);

// Product Quote Request (Model-Repository-Service-Controller)
router.use("/quote/product-quotes", productQuotesRouter);
router.use("/quote/product-quotes/comments", quoteCommentRouter);

// Sample Request (Model-Repository-Service-Controller)
router.use("/sample-requests", sampleRequestNewRouter); // New architecture routes
router.use("/sample-request-comment", sampleRequestCommentRouter);

// ==================== CUSTOMER ENGAGEMENT ROUTES ====================
router.use("/enquiry", enquiryRouter);
router.use("/cart", cartRouter);
router.use("/chat", chatRouter);
router.use("/best-deal", bestDealRouter);
router.use("/bulk-order", bulkOrderRouter);

// ==================== CMS & CONTENT ROUTES ====================
router.use("/cms", cmsRouter);
router.use("/home", homeRouter);

// ==================== TEST ROUTES ====================
router.use("/test-email", testEmailRouter);







export default router;
