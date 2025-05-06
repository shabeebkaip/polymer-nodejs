import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    // Basic Info
    productName: { type: String, required: true }, // Name of the product
    chemicalName: { type: String, required: true },
    tradeName: { type: String, required: false },
    chemicalFamily:{ type: String, required: true },
    polymerType: { type: String },
    manufacturingMethod: { type: String, required: true },
    physicalForm:[{ type: Schema.Types.ObjectId, ref: "physicalForm" },],
    productImages: { type: [String], required: false }, // Image URL
    countryOfOrigin:[{ type: Schema.Types.ObjectId, ref: "countryOfOringin" },],
    description: { type: String, required: false }, // Product description
    additionalInfo: { type: [String],required: false,  default: [] },
    color: { type: String, required: false },
    density: { type: Number, required: false },
    mfi: { type: Number, required: false },
    tensileStrength: { type: Number, required: false },
    elongationAtBreak: { type: Number, required: false },
    shoreHardness: { type: Number, required: false },
    waterAbsorption: { type: Number, required: false },
    safety_data_sheet: { type: String, required: false }, // Safety Data Sheet URL
    technical_data_sheet: { type: String, required: false }, // Technical Data Sheet URL
    certificate_of_analysis: { type: String, required: false }, // Certificates Of Analysis
    minimum_order_quantity: { type: Number, required: true }, // Minimum order quantity
    stock: { type: Number, required: true }, // Available stock
    // unitOfSale: [{ type: Schema.Types.ObjectId, ref: "unitOfSale" }],
    unitOfSale: {
      type: String,
      enum: ["KG", "Ton", "Bag"],
      required: true
    },
    price: { type: Number, required: true }, // Price
    priceTerms: { type: String,  enum: ["fixed", "negotiable"], required: false, default: "fixed", },
    leadTime: { type: Date, required: false, },
    paymentTerms:[{ type: Schema.Types.ObjectId, ref: "paymentTerms" } ,],
    packagingType:[{ type: Schema.Types.ObjectId, ref: "packagingType" }],
    packagingWeight: { type: Number, required: false },
    storageConditions: { type: String, required: false },
    shelfLife: { type: String, required: false },
        min_purity: { type: Number, required: false }, // Minimum purity percentage
    uom: { type: String, required: true }, // Unit of Measure
    recyclable: {
      type: Boolean,
      required: false,   
      default: false
    },
    bioDegradable: {
      type: Boolean,
      required: false,  
      default: false
    },
    fdaApproved: {
      type: Boolean,
      required: false,    
      default: false
    },
    medicalGrade: {
      type: Boolean,
      required: false,    
      default: false
    },

    

        // References
    brand: { type: Schema.Types.ObjectId, ref: "Brand" }, // Reference to Brand
    createdBy: { type: Schema.Types.ObjectId, ref: "Auth", required: true }, // Created by

    // Multi-references
    industry: [
      { type: Schema.Types.ObjectId, ref: "Industry", required: true }, // Linked industries
    ],
    appearance: [{ type: Schema.Types.ObjectId, ref: "Appearance" }],
    substance: [
      { type: Schema.Types.ObjectId, ref: "Substance" }, // Chemical substances
    ],

    grade: [
      { type: Schema.Types.ObjectId, ref: "Grade" }, // Grades (e.g., industrial, food)
    ],
    incoterms: [
      { type: Schema.Types.ObjectId, ref: "Incoterms" }, // Trade incoterms
    ],
    product_family: [
      { type: Schema.Types.ObjectId, ref: "productFamily" }, // Product family classification
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
