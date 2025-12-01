import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    // Basic identification & descriptions
    productName: { type: String, required: true },
    tradeName: { type: String, required: false },
    chemicalName: { type: String, required: true },
    description: { type: String, required: false },
    ar_description: { type: String, required: false },
    ger_description: { type: String, required: false },
    cn_description: { type: String, required: false },
    additionalInfo: [Schema.Types.Mixed],
    manufacturingMethod: { type: String, required: false },
    countryOfOrigin: { type: String, required: false },
    color: { type: String, required: false },
    productImages: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        fileUrl: { type: String, required: true },
      },
    ],

    // Classification & relationships
    chemicalFamily: { type: Schema.Types.ObjectId, ref: "chemicalFamily", required: true },
    polymerType: { type: Schema.Types.ObjectId, ref: "polymerType", required: true },
    industry: [{ type: Schema.Types.ObjectId, ref: "industry", required: true }],
    grade: [{ type: Schema.Types.ObjectId, ref: "Grade" }],
    physicalForm: { type: Schema.Types.ObjectId, ref: "physicalForm", required: true },
    product_family: [{ type: Schema.Types.ObjectId, ref: "productFamily" }],

    // Physical specifications
    density: { type: Number, required: false },
    mfi: { type: Number, required: false },
    tensileStrength: { type: Number, required: false },
    elongationAtBreak: { type: Number, required: false },
    flexuralModulus: { type: Number, required: false },
    shoreHardness: { type: Number, required: false },
    waterAbsorption: { type: Number, required: false },

    // Supporting documents
    safety_data_sheet: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false },
      viewUrl: { type: String, required: false },
    },
    technical_data_sheet: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false },
      viewUrl: { type: String, required: false },
    },
    certificate_of_analysis: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false },
      viewUrl: { type: String, required: false },
    },
    certificates: [
      {
        name: { type: String, required: true },
        issuingAuthority: { type: String, required: false },
        certificateNumber: { type: String, required: false },
        issueDate: { type: Date, required: false },
        expiryDate: { type: Date, required: false },
        document: {
          id: { type: String, required: false },
          name: { type: String, required: false },
          type: { type: String, required: false },
          fileUrl: { type: String, required: false },
          viewUrl: { type: String, required: false },
        },
        description: { type: String, required: false },
      },
    ],

    // Inventory & commercial data
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
    leadTime: { type: String, required: false },
    paymentTerms: { type: Schema.Types.ObjectId, ref: "paymentTerms" },
    packagingType: [{ type: Schema.Types.ObjectId, ref: "packagingType" }],
    packagingWeight: { type: String, required: false },
    storageConditions: { type: String, required: false },
    shelfLife: { type: String, required: false },

    // Compliance indicators
    recyclable: { type: Boolean, default: false },
    bioDegradable: { type: Boolean, default: false },
    fdaApproved: { type: Boolean, default: false },
    fdaCertificate: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false },
      viewUrl: { type: String, required: false },
    },
    medicalGrade: { type: Boolean, default: false },
    medicalCertificate: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      type: { type: String, required: false },
      fileUrl: { type: String, required: false },
      viewUrl: { type: String, required: false },
    },

    // Ownership metadata
    createdBy: { type: Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

const documentHasFile = (doc = {}) => Boolean(doc?.id || doc?.fileUrl || doc?.viewUrl);

productSchema.pre("validate", function (next) {
  const errors = [];

  if (this.fdaApproved && !documentHasFile(this.fdaCertificate)) {
    errors.push("Upload an FDA approval certificate when FDA Approved is enabled.");
  }

  if (this.medicalGrade && !documentHasFile(this.medicalCertificate)) {
    errors.push("Upload a medical-grade certificate when Medical Grade is enabled.");
  }

  if (errors.length) {
    return next(new Error(errors.join(" ")));
  }

  return next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
