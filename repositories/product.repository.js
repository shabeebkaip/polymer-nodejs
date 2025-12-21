import Product from "../models/product.js";
import ChemicalFamily from "../models/chemicalFamily.js";
import PhysicalForm from "../models/physicalForm.js";
import PolymerType from "../models/polymerType.js";
import Industry from "../models/industry.js";
import Grade from "../models/grade.js";
import Incoterm from "../models/incoterm.js";
import PaymentTerms from "../models/paymentTerms.js";
import PackagingType from "../models/packagingType.js";
import User from "../models/user.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

/**
 * Product Repository - Data Access Layer
 * Handles all database operations for products
 */
class ProductRepository {
  // ========================
  // AGGREGATION PIPELINE
  // ========================

  /**
   * Get standard product aggregation pipeline
   */
  getProductAggregation() {
    return [
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "industries",
          localField: "industry",
          foreignField: "_id",
          as: "industry",
        },
      },
      {
        $lookup: {
          from: "chemicalfamilies",
          localField: "chemicalFamily",
          foreignField: "_id",
          as: "chemicalFamily",
        },
      },
      { $unwind: { path: "$chemicalFamily", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "polymertypes",
          localField: "polymerType",
          foreignField: "_id",
          as: "polymerType",
        },
      },
      { $unwind: { path: "$polymerType", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "grade",
          foreignField: "_id",
          as: "grade",
        },
      },
      {
        $lookup: {
          from: "incoterms",
          localField: "incoterms",
          foreignField: "_id",
          as: "incoterms",
        },
      },
      {
        $lookup: {
          from: "physicalforms",
          localField: "physicalForm",
          foreignField: "_id",
          as: "physicalForm",
        },
      },
      { $unwind: { path: "$physicalForm", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "productfamilies",
          localField: "product_family",
          foreignField: "_id",
          as: "productfamilie",
        },
      },
      {
        $lookup: {
          from: "packagingtypes",
          localField: "packagingType",
          foreignField: "_id",
          as: "packageType",
        },
      },
      {
        $lookup: {
          from: "paymentterms",
          localField: "paymentTerms",
          foreignField: "_id",
          as: "paymentTerms",
        },
      },
      { $unwind: { path: "$paymentTerms", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productName: 1,
          chemicalName: 1,
          description: { $ifNull: [{ $trim: { input: "$description" } }, ""] },
          ar_description: { $ifNull: [{ $trim: { input: "$ar_description" } }, ""] },
          ger_description: { $ifNull: [{ $trim: { input: "$ger_description" } }, ""] },
          cn_description: { $ifNull: [{ $trim: { input: "$cn_description" } }, ""] },
          additionalInfo: 1,
          tradeName: 1,
          chemicalFamily: {
            _id: "$chemicalFamily._id",
            name: { $ifNull: [{ $trim: { input: "$chemicalFamily.name" } }, ""] },
            ar_name: { $ifNull: [{ $trim: { input: "$chemicalFamily.ar_name" } }, ""] },
            ger_name: { $ifNull: [{ $trim: { input: "$chemicalFamily.ger_name" } }, ""] },
            cn_name: { $ifNull: [{ $trim: { input: "$chemicalFamily.cn_name" } }, ""] },
          },
          polymerType: {
            _id: "$polymerType._id",
            name: { $ifNull: [{ $trim: { input: "$polymerType.name" } }, ""] },
            ar_name: { $ifNull: [{ $trim: { input: "$polymerType.ar_name" } }, ""] },
            ger_name: { $ifNull: [{ $trim: { input: "$polymerType.ger_name" } }, ""] },
            cn_name: { $ifNull: [{ $trim: { input: "$polymerType.cn_name" } }, ""] },
          },
          industry: {
            $map: {
              input: { $ifNull: ["$industry", []] },
              as: "ind",
              in: {
                _id: "$$ind._id",
                name: { $ifNull: [{ $trim: { input: "$$ind.name" } }, ""] },
                ar_name: { $ifNull: [{ $trim: { input: "$$ind.ar_name" } }, ""] },
                ger_name: { $ifNull: [{ $trim: { input: "$$ind.ger_name" } }, ""] },
                cn_name: { $ifNull: [{ $trim: { input: "$$ind.cn_name" } }, ""] },
              },
            },
          },
          grade: {
            $map: {
              input: { $ifNull: ["$grade", []] },
              as: "g",
              in: {
                _id: "$$g._id",
                name: { $ifNull: [{ $trim: { input: "$$g.name" } }, ""] },
                ar_name: { $ifNull: [{ $trim: { input: "$$g.ar_name" } }, ""] },
                ger_name: { $ifNull: [{ $trim: { input: "$$g.ger_name" } }, ""] },
                cn_name: { $ifNull: [{ $trim: { input: "$$g.cn_name" } }, ""] },
              },
            },
          },
          physicalForm: {
            _id: "$physicalForm._id",
            name: { $ifNull: [{ $trim: { input: "$physicalForm.name" } }, ""] },
            ar_name: { $ifNull: [{ $trim: { input: "$physicalForm.ar_name" } }, ""] },
            ger_name: { $ifNull: [{ $trim: { input: "$physicalForm.ger_name" } }, ""] },
            cn_name: { $ifNull: [{ $trim: { input: "$physicalForm.cn_name" } }, ""] },
          },
          manufacturingMethod: 1,
          countryOfOrigin: 1,
          color: 1,
          productImages: 1,
          density: 1,
          mfi: 1,
          tensileStrength: 1,
          elongationAtBreak: 1,
          shoreHardness: 1,
          waterAbsorption: 1,
          safety_data_sheet: "$safety_data_sheet",
          technical_data_sheet: "$technical_data_sheet",
          certificate_of_analysis: "$certificate_of_analysis",
          minimum_order_quantity: 1,
          stock: 1,
          uom: 1,
          price: 1,
          priceTerms: 1,
          incoterms: {
            $map: {
              input: { $ifNull: ["$incoterms", []] },
              as: "term",
              in: {
                _id: "$$term._id",
                name: { $ifNull: [{ $trim: { input: "$$term.name" } }, ""] },
              },
            },
          },
          leadTime: 1,
          paymentTerms: {
            _id: "$paymentTerms._id",
            name: { $ifNull: [{ $trim: { input: "$paymentTerms.name" } }, ""] },
            ar_name: { $ifNull: [{ $trim: { input: "$paymentTerms.ar_name" } }, ""] },
            ger_name: { $ifNull: [{ $trim: { input: "$paymentTerms.ger_name" } }, ""] },
            cn_name: { $ifNull: [{ $trim: { input: "$paymentTerms.cn_name" } }, ""] },
          },
          packagingType: {
            $map: {
              input: { $ifNull: ["$packageType", []] },
              as: "pt",
              in: {
                _id: "$$pt._id",
                name: { $ifNull: [{ $trim: { input: "$$pt.name" } }, ""] },
                ar_name: { $ifNull: [{ $trim: { input: "$$pt.ar_name" } }, ""] },
                ger_name: { $ifNull: [{ $trim: { input: "$$pt.ger_name" } }, ""] },
                cn_name: { $ifNull: [{ $trim: { input: "$$pt.cn_name" } }, ""] },
              },
            },
          },
          packagingWeight: 1,
          storageConditions: 1,
          shelfLife: 1,
          recyclable: 1,
          fdaApproved: 1,
          fdaCertificate: { $ifNull: ["$fdaCertificate", {}] },
          bioDegradable: 1,
          medicalGrade: 1,
          medicalCertificate: { $ifNull: ["$medicalCertificate", {}] },
          certificates: { $ifNull: ["$certificates", []] },
          product_family: {
            $map: {
              input: { $ifNull: ["$productfamilie", []] },
              as: "pf",
              in: {
                _id: "$$pf._id",
                name: { $ifNull: [{ $trim: { input: "$$pf.name" } }, ""] },
                ar_name: { $ifNull: [{ $trim: { input: "$$pf.ar_name" } }, ""] },
                ger_name: { $ifNull: [{ $trim: { input: "$$pf.ger_name" } }, ""] },
                cn_name: { $ifNull: [{ $trim: { input: "$$pf.cn_name" } }, ""] },
              },
            },
          },
          createdBy: {
            name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
            email: "$user.email",
            company: "$user.company",
            company_logo: "$user.company_logo",
            website: "$user.website",
            phone: "$user.phone",
            address: "$user.address",
            location: "$user.location",
            _id: "$user._id",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];
  }

  // ========================
  // CRUD OPERATIONS
  // ========================

  /**
   * Create a new product
   */
  async create(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  /**
   * Find product by ID
   */
  async findById(productId) {
    return await Product.findById(productId);
  }

  /**
   * Find product by ID with full aggregation
   */
  async findByIdWithDetails(productId) {
    const pipeline = [
      { $match: { _id: new ObjectId(productId) } },
      ...this.getProductAggregation(),
    ];
    const products = await Product.aggregate(pipeline);
    return products[0] || null;
  }

  /**
   * Update product by ID
   */
  async update(productId, updateData) {
    return await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete product by ID
   */
  async delete(productId) {
    return await Product.findByIdAndDelete(productId);
  }

  // ========================
  // LIST & FILTER OPERATIONS
  // ========================

  /**
   * Build match stage from filters
   */
  buildMatchStage(filters) {
    const matchStage = {};

    if (filters.search) {
      matchStage.productName = { $regex: filters.search, $options: "i" };
    }

    if (filters.chemicalFamily?.length) {
      matchStage.chemicalFamily = {
        $in: filters.chemicalFamily.map((id) => new ObjectId(id)),
      };
    }

    if (filters.polymerType?.length) {
      matchStage.polymerType = {
        $in: filters.polymerType.map((id) => new ObjectId(id)),
      };
    }

    if (filters.industry?.length) {
      matchStage.industry = {
        $in: filters.industry.map((id) => new ObjectId(id)),
      };
    }

    if (filters.grade?.length) {
      matchStage.grade = {
        $in: filters.grade.map((id) => new ObjectId(id)),
      };
    }

    if (filters.physicalForm?.length) {
      matchStage.physicalForm = {
        $in: filters.physicalForm.map((id) => new ObjectId(id)),
      };
    }

    if (filters.countryOfOrigin?.length) {
      matchStage.countryOfOrigin = { $in: filters.countryOfOrigin };
    }

    if (filters.uom?.length) {
      matchStage.uom = { $in: filters.uom };
    }

    if (filters.priceTerms) {
      matchStage.priceTerms = filters.priceTerms;
    }

    if (filters.incoterms?.length) {
      matchStage.incoterms = {
        $in: filters.incoterms.map((id) => new ObjectId(id)),
      };
    }

    if (filters.paymentTerms?.length) {
      matchStage.paymentTerms = {
        $in: filters.paymentTerms.map((id) => new ObjectId(id)),
      };
    }

    if (filters.packagingType?.length) {
      matchStage.packagingType = {
        $in: filters.packagingType.map((id) => new ObjectId(id)),
      };
    }

    if (filters.recyclable !== undefined) {
      matchStage.recyclable = filters.recyclable;
    }

    if (filters.bioDegradable !== undefined) {
      matchStage.bioDegradable = filters.bioDegradable;
    }

    if (filters.fdaApproved !== undefined) {
      matchStage.fdaApproved = filters.fdaApproved;
    }

    if (filters.medicalGrade !== undefined) {
      matchStage.medicalGrade = filters.medicalGrade;
    }

    if (filters.company?.length) {
      matchStage.createdBy = {
        $in: filters.company.map((id) => new ObjectId(id)),
      };
    }

    if (filters.createdBy?.length) {
      matchStage.createdBy = {
        $in: filters.createdBy.map((id) => new ObjectId(id)),
      };
    }

    if (filters.product_family?.length) {
      matchStage.product_family = {
        $in: filters.product_family.map((id) => new ObjectId(id)),
      };
    }

    return matchStage;
  }

  /**
   * Get products with filtering and pagination
   */
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const matchStage = this.buildMatchStage(filters);

    const pipeline = [
      { $match: matchStage },
      ...this.getProductAggregation(),
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [{ $match: matchStage }, { $count: "total" }];

    const [products, totalCountResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline),
    ]);

    const total = totalCountResult[0]?.total || 0;

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ========================
  // FILTER OPTIONS
  // ========================

  /**
   * Get field counts for filters
   */
  async getFieldCounts(fieldName, currentFilters = {}) {
    const baseMatch = this.buildMatchStage(currentFilters);
    const pipeline = [
      { $match: baseMatch },
      { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];
    return await Product.aggregate(pipeline);
  }

  /**
   * Get boolean field counts
   */
  async getBooleanFieldCounts(fieldName, currentFilters = {}) {
    const baseMatch = this.buildMatchStage(currentFilters);
    const pipeline = [
      { $match: baseMatch },
      { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
    ];
    return await Product.aggregate(pipeline);
  }

  /**
   * Get all filter options data
   */
  async getFilterOptionsData() {
    const [
      chemicalfamilies,
      polymertypes,
      industries,
      grades,
      physicalForms,
      incoterms,
      paymentTerms,
      packagingTypes,
      usersRaw,
      countries,
      uoms,
    ] = await Promise.all([
      ChemicalFamily.find({}, { name: 1 }).lean(),
      PolymerType.find({}, { name: 1 }).lean(),
      Industry.find({}, { name: 1 }).lean(),
      Grade.find({}, { name: 1 }).lean(),
      PhysicalForm.find({}, { name: 1 }).lean(),
      Incoterm.find({}, { name: 1 }).lean(),
      PaymentTerms.find({}, { name: 1 }).lean(),
      PackagingType.find({}, { name: 1 }).lean(),
      User.find({ user_type: "seller" }, { company: 1 }).lean(),
      Product.distinct("countryOfOrigin"),
      Product.distinct("uom"),
    ]);

    const users = usersRaw
      .filter((user) => user.company)
      .map((user) => ({
        _id: user._id,
        name: user.company,
      }));

    return {
      chemicalfamilies,
      polymertypes,
      industries,
      grades,
      physicalForms,
      incoterms,
      paymentTerms,
      packagingTypes,
      users,
      countries,
      uoms,
    };
  }

  /**
   * Get all filter counts
   */
  async getFilterCounts(currentFilters = {}) {
    const [
      chemicalFamilyCounts,
      polymerTypeCounts,
      industryCounts,
      gradeCounts,
      physicalFormCounts,
      countryCounts,
      uomCounts,
      priceTermsCounts,
      incotermsCounts,
      paymentTermsCounts,
      packagingTypeCounts,
      recyclableCounts,
      bioDegradableCounts,
      fdaApprovedCounts,
      medicalGradeCounts,
      companyCounts,
    ] = await Promise.all([
      this.getFieldCounts("chemicalFamily", currentFilters),
      this.getFieldCounts("polymerType", currentFilters),
      this.getFieldCounts("industry", currentFilters),
      this.getFieldCounts("grade", currentFilters),
      this.getFieldCounts("physicalForm", currentFilters),
      this.getFieldCounts("countryOfOrigin", currentFilters),
      this.getFieldCounts("uom", currentFilters),
      this.getFieldCounts("priceTerms", currentFilters),
      this.getFieldCounts("incoterms", currentFilters),
      this.getFieldCounts("paymentTerms", currentFilters),
      this.getFieldCounts("packagingType", currentFilters),
      this.getBooleanFieldCounts("recyclable", currentFilters),
      this.getBooleanFieldCounts("bioDegradable", currentFilters),
      this.getBooleanFieldCounts("fdaApproved", currentFilters),
      this.getBooleanFieldCounts("medicalGrade", currentFilters),
      this.getFieldCounts("createdBy", currentFilters),
    ]);

    return {
      chemicalFamilyCounts,
      polymerTypeCounts,
      industryCounts,
      gradeCounts,
      physicalFormCounts,
      countryCounts,
      uomCounts,
      priceTermsCounts,
      incotermsCounts,
      paymentTermsCounts,
      packagingTypeCounts,
      recyclableCounts,
      bioDegradableCounts,
      fdaApprovedCounts,
      medicalGradeCounts,
      companyCounts,
    };
  }

  // ========================
  // HELPER: HANDLE "OTHER" OPTIONS
  // ========================

  /**
   * Handle "Other" option for chemicalFamily
   */
  async findOrCreateChemicalFamily(name) {
    let chemicalFamily = await ChemicalFamily.findOne({ name });
    if (!chemicalFamily) {
      chemicalFamily = await ChemicalFamily.create({ name });
    }
    return chemicalFamily;
  }

  /**
   * Handle "Other" option for physicalForm
   */
  async findOrCreatePhysicalForm(name) {
    let physicalForm = await PhysicalForm.findOne({ name });
    if (!physicalForm) {
      physicalForm = await PhysicalForm.create({ name });
    }
    return physicalForm;
  }

  /**
   * Handle "Other" option for polymerType
   */
  async findOrCreatePolymerType(name) {
    let polymerType = await PolymerType.findOne({ name });
    if (!polymerType) {
      polymerType = await PolymerType.create({ name });
    }
    return polymerType;
  }

  // ========================
  // STATISTICS
  // ========================

  /**
   * Count all products
   */
  async countAll() {
    return await Product.countDocuments();
  }

  /**
   * Count products by seller
   */
  async countBySeller(sellerId) {
    return await Product.countDocuments({ createdBy: new ObjectId(sellerId) });
  }

  /**
   * Count products in date range
   */
  async countByDateRange(startDate, endDate) {
    return await Product.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }
}

// Create singleton instance
const productRepository = new ProductRepository();

// Export the singleton as default
export default productRepository;

// Export function for backward compatibility with external files
export const productAggregation = () => productRepository.getProductAggregation();
