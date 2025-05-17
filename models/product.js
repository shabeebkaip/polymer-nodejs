import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    productName: { type: String, required: true },
    chemicalName: { type: String, required: true },
    description: { type: String, required: false },
    additionalInfo: [Schema.Types.Mixed],
    tradeName: { type: String, required: false },
    chemicalFamily: { type: Schema.Types.ObjectId, ref: "chemicalFamily", required: true },
    polymerType: { type: Schema.Types.ObjectId, ref: "polymerType", required: true },
    industry: [{ type: Schema.Types.ObjectId, ref: "industry", required: true }],
    grade: [{ type: Schema.Types.ObjectId, ref: "Grade" }],
    manufacturingMethod: { type: String, required: false },
    physicalForm: { type: Schema.Types.ObjectId, ref: "physicalForm", required: true },
    countryOfOrigin: { type: String, required: false },
    color: { type: String, required: false },
    productImages: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
      fileUrl: { type: String, required: true }
    }],    
    density: { type: Number, required: false },
    mfi: { type: Number, required: false },
    tensileStrength: { type: Number, required: false },
    elongationAtBreak: { type: Number, required: false },
    shoreHardness: { type: Number, required: false },
    waterAbsorption: { type: Number, required: false },
    safety_data_sheet: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false }
    },
    technical_data_sheet: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false }
    },
    certificate_of_analysis: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false }
    },
    minimum_order_quantity: { type: Number, required: true },
    stock: { type: Number, required: true },
    uom: { type: String, required: true },
    price: { type: Number, required: true },
    priceTerms: {
      type: String,
      enum: ["fixed", "negotiable"],
      required: false,
      default: "fixed",
    },
    incoterms: [{ type: Schema.Types.ObjectId, ref: "Incoterms", required: true }],
    leadTime: { type: Date, required: false },
    paymentTerms: { type: Schema.Types.ObjectId, ref: "paymentTerms" },
    packagingType: [{ type: Schema.Types.ObjectId, ref: "packagingType" }],
    packagingWeight: { type: String, required: false },
    storageConditions: { type: String, required: false },
    shelfLife: { type: String, required: false },
    recyclable: { type: Boolean, default: false },
    bioDegradable: { type: Boolean, default: false },
    fdaApproved: { type: Boolean, default: false },
    medicalGrade: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "user", required: true },
    product_family: [{ type: Schema.Types.ObjectId, ref: "productFamily" }],
    
  },
  
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
