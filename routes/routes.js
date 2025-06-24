import express from "express";
import fileRouter from "./files/file.js";
import categoryRouter from "./category/category.js";
import subCategoryRouter from "./subCategory/subCategory.js";
import brandRouter from "./brand/brand.js";
import productRouter from "./product/product.js";
import chemicalFamilyRouter from "./chemicalFamily/chemicalFamily.js";
import enquiryRouter from "./enquiry/enquiry.js";
import userRouter from "./user/user.js";
import industryRouter from "./industry/industry.js";
import productFamilyRouter from "./productFamily/productFamily.js";
import authRouter from "./auth/auth.js";
import cartRouter from "./cart/cart.js";
import adminRouter from "./admins/admin.js";
import appearanceRouter from "./appearance/appearance.js";
import substanceRouter from "./substance/substance.js";
import gradeRouter from "./grade/grade.js";
import incotermRouter from "./incoterm/incoterm.js";
import requestRouter from "./request/request.js";
import physicalFormRouter from "./physicalForm/physicalForm.js";
import polymerTypeRouter from "./polymerType/polimerType.js";
import packagingTypeRouter from "./packagingType/packagingType.js";
import paymentTermsRouter from "./paymentTerms/paymentTerms.js";
import sampleRequestRouter from "./request/api/sample.js";
import sampleRouter from "./sampleRequest/sampleRequest.js";
import quoteRouter from "./quoteRequest/quoteRequest.js";
import financeRouter from "./finance/finance.js";
import cmsRouter from "./cms/cms.js";
import homeRouter from "./home/home.js";
import chatRouter from "./chat/chat.js";
import bestDealRouter from "./bestDeal/bestDeal.js";
import bulkOrderRouter from "./bulkOrder/bulkOrder.js";
// import testimonialRoutes from "./testimonials/testimonials.js";

const router = express.Router();

router.use("/file", fileRouter);
router.use("/auth", authRouter);
router.use("/category", categoryRouter);
router.use("/sub-category", subCategoryRouter);
router.use("/brand", brandRouter);
router.use("/product", productRouter);
router.use("/chemical-family", chemicalFamilyRouter);
router.use("/enquiry", enquiryRouter);
router.use("/user", userRouter);
router.use("/industry", industryRouter);
router.use("/product-family", productFamilyRouter);
router.use("/cart", cartRouter);
router.use("/admin", adminRouter);
router.use("/appearance", appearanceRouter);
router.use("/substance", substanceRouter);
router.use("/grade", gradeRouter);
router.use("/incoterm", incotermRouter);
router.use("/request", requestRouter);
router.use("/physical-form", physicalFormRouter);
router.use("/packaging-type", packagingTypeRouter);
router.use("/polymer-type", polymerTypeRouter);
router.use("/payment-terms", paymentTermsRouter);
router.use("/sample-request", sampleRouter);
router.use("/quote-request", quoteRouter);
router.use("/finance", financeRouter);
router.use("/cms", cmsRouter);
router.use("/home", homeRouter);
router.use("/chat", chatRouter);
router.use("/best-deal", bestDealRouter)
router.use("/bulk-order", bulkOrderRouter)
// router.use("/testimonial", testimonialRoutes)







export default router;
