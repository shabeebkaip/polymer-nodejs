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
router.use("/product-family",productFamilyRouter)
router.use("/cart",cartRouter)
router.use('/admin', adminRouter)

export default router;
