import productRepository from "../repositories/product.repository.js";
import config from "../config/config.js";

/**
 * Product Service - Business Logic Layer
 * Handles all business logic for product operations
 */
class ProductService {
  // ========================
  // CREATE PRODUCT
  // ========================

  /**
   * Create a new product
   * Handles "Other" option for chemicalFamily, physicalForm, polymerType
   * 
   * For Admin flow:
   * - If sellerId is provided in productData, create product under that seller
   * - Otherwise, create product under the logged-in user (admin themselves)
   * 
   * For Seller flow:
   * - Product is always created under the logged-in seller
   */
  async createProduct(productData, user) {
    // Handle "Other" chemicalFamily (accepts both "Other"/"other" and otherChemicalFamily/chemicalFamilyOther)
    const chemFamilyOtherVal = productData.otherChemicalFamily || productData.chemicalFamilyOther;
    if (productData.chemicalFamily?.toLowerCase() === "other" && chemFamilyOtherVal) {
      const chemicalFamily = await productRepository.findOrCreateChemicalFamily(chemFamilyOtherVal);
      productData.chemicalFamily = chemicalFamily._id;
      delete productData.otherChemicalFamily;
      delete productData.chemicalFamilyOther;
    } else if (productData.chemicalFamily?.toLowerCase() === "other") {
      delete productData.chemicalFamily;
    }

    // Handle "Other" physicalForm (accepts both "Other"/"other" and otherPhysicalForm/physicalFormOther)
    const physFormOtherVal = productData.otherPhysicalForm || productData.physicalFormOther;
    if (productData.physicalForm?.toLowerCase() === "other" && physFormOtherVal) {
      const physicalForm = await productRepository.findOrCreatePhysicalForm(physFormOtherVal);
      productData.physicalForm = physicalForm._id;
      delete productData.otherPhysicalForm;
      delete productData.physicalFormOther;
    } else if (productData.physicalForm?.toLowerCase() === "other") {
      delete productData.physicalForm;
    }

    // Handle "Other" polymerType (accepts both "Other"/"other" and otherPolymerType/polymerTypeOther)
    const polymerOtherVal = productData.otherPolymerType || productData.polymerTypeOther;
    if (productData.polymerType?.toLowerCase() === "other" && polymerOtherVal) {
      const polymerType = await productRepository.findOrCreatePolymerType(polymerOtherVal);
      productData.polymerType = polymerType._id;
      delete productData.otherPolymerType;
      delete productData.polymerTypeOther;
    } else if (productData.polymerType?.toLowerCase() === "other") {
      delete productData.polymerType;
    }

    // Determine the creator:
    // - If admin provides sellerId, use that seller
    // - Otherwise, use the logged-in user (works for both admin creating for self and seller creating)
    if (user.user_type === "superAdmin" && productData.sellerId) {
      productData.createdBy = productData.sellerId;
      delete productData.sellerId; // Remove from product data
    } else {
      productData.createdBy = user.id || user._id;
    }

    // Create the product
    const product = await productRepository.create(productData);

    return product;
  }

  // ========================
  // GET PRODUCTS
  // ========================

  /**
   * Get products with filtering and pagination
   */
  async getProducts(filters = {}, options = {}) {
    const result = await productRepository.findAll(filters, options);
    return result;
  }

  /**
   * Get single product by ID with full details
   */
  async getProductById(productId) {
    const product = await productRepository.findByIdWithDetails(productId);
    if (!product) {
      return null;
    }

    // Add chat integration info
    product.chatInfo = {
      description:
        "To initiate a chat with the seller, use the socket.io connection",
      endpoints: {
        connect: `${config.API_URL}`,
        events: {
          joinRoom: "join",
          sendMessage: "chat message",
          receiveMessage: "chat message",
          disconnect: "disconnect",
        },
      },
      socketEvents: {
        toJoinRoom: {
          event: "join",
          payload: {
            recipientId: product.createdBy._id,
            senderId: "YOUR_USER_ID",
          },
        },
        toSendMessage: {
          event: "chat message",
          payload: {
            recipientId: product.createdBy._id,
            senderId: "YOUR_USER_ID",
            message: "Your message here",
            roomId: "Generated from join event",
          },
        },
        toReceiveMessages: {
          event: "chat message",
          description: "Listen for incoming messages on this event",
        },
      },
    };

    return product;
  }

  // ========================
  // UPDATE PRODUCT
  // ========================

  /**
   * Update a product
   * Handles "Other" option for chemicalFamily, physicalForm, polymerType
   */
  async updateProduct(productId, updateData) {
    // Handle "Other" chemicalFamily (accepts both "Other"/"other" and otherChemicalFamily/chemicalFamilyOther)
    const chemFamilyOtherVal = updateData.otherChemicalFamily || updateData.chemicalFamilyOther;
    if (updateData.chemicalFamily?.toLowerCase() === "other" && chemFamilyOtherVal) {
      const chemicalFamily = await productRepository.findOrCreateChemicalFamily(chemFamilyOtherVal);
      updateData.chemicalFamily = chemicalFamily._id;
      delete updateData.otherChemicalFamily;
      delete updateData.chemicalFamilyOther;
    } else if (updateData.chemicalFamily?.toLowerCase() === "other") {
      delete updateData.chemicalFamily;
    }

    // Handle "Other" physicalForm (accepts both "Other"/"other" and otherPhysicalForm/physicalFormOther)
    const physFormOtherVal = updateData.otherPhysicalForm || updateData.physicalFormOther;
    if (updateData.physicalForm?.toLowerCase() === "other" && physFormOtherVal) {
      const physicalForm = await productRepository.findOrCreatePhysicalForm(physFormOtherVal);
      updateData.physicalForm = physicalForm._id;
      delete updateData.otherPhysicalForm;
      delete updateData.physicalFormOther;
    } else if (updateData.physicalForm?.toLowerCase() === "other") {
      delete updateData.physicalForm;
    }

    // Handle "Other" polymerType (accepts both "Other"/"other" and otherPolymerType/polymerTypeOther)
    const polymerOtherVal = updateData.otherPolymerType || updateData.polymerTypeOther;
    if (updateData.polymerType?.toLowerCase() === "other" && polymerOtherVal) {
      const polymerType = await productRepository.findOrCreatePolymerType(polymerOtherVal);
      updateData.polymerType = polymerType._id;
      delete updateData.otherPolymerType;
      delete updateData.polymerTypeOther;
    } else if (updateData.polymerType?.toLowerCase() === "other") {
      delete updateData.polymerType;
    }

    // Admin can reassign product to different seller
    if (updateData.sellerId) {
      updateData.createdBy = updateData.sellerId;
      delete updateData.sellerId;
    }

    // Update the product
    const product = await productRepository.update(productId, updateData);

    return product;
  }

  // ========================
  // DELETE PRODUCT
  // ========================

  /**
   * Delete a product
   */
  async deleteProduct(productId, user) {
    // Check if product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      return { success: false, message: "Product not found" };
    }

    // Authorization check: only owner or superAdmin can delete
    if (
      user.user_type !== "superAdmin" &&
      product.createdBy.toString() !== (user.id || user._id).toString()
    ) {
      return { success: false, message: "Not authorized to delete this product" };
    }

    await productRepository.delete(productId);
    return { success: true, message: "Product deleted successfully" };
  }

  // ========================
  // FILTER OPTIONS
  // ========================

  /**
   * Get filter options with counts for faceted search
   */
  async getFilterOptions(currentFilters = {}) {
    // Get all filter options data and counts in parallel
    const [filterOptionsData, filterCounts] = await Promise.all([
      productRepository.getFilterOptionsData(),
      productRepository.getFilterCounts(currentFilters),
    ]);

    const {
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
    } = filterOptionsData;

    const {
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
    } = filterCounts;

    // Helper function to map counts to options
    const mapCounts = (options, counts) => {
      const countMap = new Map(
        counts.map((c) => [c._id?.toString(), c.count])
      );
      return options.map((opt) => ({
        _id: opt._id,
        name: opt.name,
        count: countMap.get(opt._id?.toString()) || 0,
      }));
    };

    // Helper for array field counts
    const mapArrayFieldCounts = (options, counts) => {
      const countMap = new Map();
      counts.forEach((c) => {
        if (c._id) {
          const idStr = c._id.toString();
          countMap.set(idStr, (countMap.get(idStr) || 0) + c.count);
        }
      });
      return options.map((opt) => ({
        _id: opt._id,
        name: opt.name,
        count: countMap.get(opt._id?.toString()) || 0,
      }));
    };

    // Helper for string arrays (country, uom)
    const mapStringCounts = (options, counts) => {
      const countMap = new Map(counts.map((c) => [c._id, c.count]));
      return options
        .filter((opt) => opt)
        .map((opt) => ({
          name: opt,
          count: countMap.get(opt) || 0,
        }));
    };

    // Helper for boolean counts
    const mapBooleanCounts = (counts) => {
      const trueCount = counts.find((c) => c._id === true)?.count || 0;
      const falseCount = counts.find((c) => c._id === false)?.count || 0;
      return { trueCount, falseCount, total: trueCount + falseCount };
    };

    // Build filter side options (sidebar filters)
    const filterSide = [
      {
        title: "Chemical Family",
        filter: "chemicalFamily",
        component: "SelectMultipleFilter",
        options: mapCounts(chemicalfamilies, chemicalFamilyCounts),
      },
      {
        title: "Polymer Type",
        filter: "polymerType",
        component: "SelectMultipleFilter",
        options: mapCounts(polymertypes, polymerTypeCounts),
      },
      {
        title: "Industry",
        filter: "industry",
        component: "SelectMultipleFilter",
        options: mapArrayFieldCounts(industries, industryCounts),
      },
      {
        title: "Grade",
        filter: "grade",
        component: "SelectMultipleFilter",
        options: mapArrayFieldCounts(grades, gradeCounts),
      },
      {
        title: "Physical Form",
        filter: "physicalForm",
        component: "SelectMultipleFilter",
        options: mapCounts(physicalForms, physicalFormCounts),
      },
      {
        title: "Country of Origin",
        filter: "countryOfOrigin",
        component: "SelectMultipleFilter",
        options: mapStringCounts(countries, countryCounts),
      },
      {
        title: "Company",
        filter: "company",
        component: "SelectMultipleFilter",
        options: mapCounts(users, companyCounts),
      },
    ];

    // Build filter top options (top bar filters)
    const filterTop = [
      {
        title: "UOM",
        filter: "uom",
        component: "SelectMultipleFilter",
        options: mapStringCounts(uoms, uomCounts),
      },
      {
        title: "Price Terms",
        filter: "priceTerms",
        component: "SelectSingleFilter",
        options: [
          {
            name: "per kg",
            count:
              priceTermsCounts.find((c) => c._id === "per kg")?.count || 0,
          },
          {
            name: "per ton",
            count:
              priceTermsCounts.find((c) => c._id === "per ton")?.count || 0,
          },
        ],
      },
      {
        title: "Incoterms",
        filter: "incoterms",
        component: "SelectMultipleFilter",
        options: mapArrayFieldCounts(incoterms, incotermsCounts),
      },
      {
        title: "Payment Terms",
        filter: "paymentTerms",
        component: "SelectMultipleFilter",
        options: mapCounts(paymentTerms, paymentTermsCounts),
      },
      {
        title: "Packaging Type",
        filter: "packagingType",
        component: "SelectMultipleFilter",
        options: mapArrayFieldCounts(packagingTypes, packagingTypeCounts),
      },
      {
        title: "Recyclable",
        filter: "recyclable",
        component: "BooleanFilter",
        ...mapBooleanCounts(recyclableCounts),
      },
      {
        title: "Bio Degradable",
        filter: "bioDegradable",
        component: "BooleanFilter",
        ...mapBooleanCounts(bioDegradableCounts),
      },
      {
        title: "FDA Approved",
        filter: "fdaApproved",
        component: "BooleanFilter",
        ...mapBooleanCounts(fdaApprovedCounts),
      },
      {
        title: "Medical Grade",
        filter: "medicalGrade",
        component: "BooleanFilter",
        ...mapBooleanCounts(medicalGradeCounts),
      },
    ];

    return {
      filterSide,
      filterTop,
    };
  }

  // ========================
  // STATISTICS (for dashboard)
  // ========================

  /**
   * Get product statistics
   */
  async getStatistics(sellerId = null) {
    if (sellerId) {
      return await productRepository.countBySeller(sellerId);
    }
    return await productRepository.countAll();
  }
}

export default new ProductService();
