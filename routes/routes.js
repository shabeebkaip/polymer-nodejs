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

const router = express.Router();

router.use("/file", fileRouter);
router.use("/category", categoryRouter);
router.use("/sub-category", subCategoryRouter);
router.use("/brand", brandRouter);
router.use("/product", productRouter);
router.use("/chemical-family", chemicalFamilyRouter);
router.use("/enquiry", enquiryRouter);
router.use("/user", userRouter);
router.use("/industry", industryRouter);

export default router;
