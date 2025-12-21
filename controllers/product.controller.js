import productService from "../services/product.service.js";

/**
 * Product Controller - HTTP Request Handler Layer
 * Handles all HTTP requests for product operations
 */
class ProductController {
  // ========================
  // CREATE PRODUCT
  // ========================

  /**
   * POST /api/v1/product/create
   * Create a new product
   * 
   * For Admin:
   * - Can provide optional `sellerId` to create product under a specific seller
   * - If no sellerId provided, product is created under admin's account
   * 
   * For Seller:
   * - Product is always created under their own account
   */
  async create(req, res) {
    try {
      const productData = req.body;
      const user = req.user; // Pass full user object for role checking

      const product = await productService.createProduct(productData, user);

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error creating product:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((e) => e.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error creating product",
        error: error.message,
      });
    }
  }

  // ========================
  // GET PRODUCTS LIST
  // ========================

  /**
   * POST /api/v1/product/list
   * Get products with filtering and pagination
   */
  async list(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        chemicalFamily,
        polymerType,
        industry,
        grade,
        physicalForm,
        countryOfOrigin,
        uom,
        priceTerms,
        incoterms,
        paymentTerms,
        packagingType,
        recyclable,
        bioDegradable,
        fdaApproved,
        medicalGrade,
        company,
        createdBy,
        product_family,
      } = req.body;

      const filters = {
        search,
        chemicalFamily,
        polymerType,
        industry,
        grade,
        physicalForm,
        countryOfOrigin,
        uom,
        priceTerms,
        incoterms,
        paymentTerms,
        packagingType,
        recyclable,
        bioDegradable,
        fdaApproved,
        medicalGrade,
        company,
        createdBy,
        product_family,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const options = { page: parseInt(page), limit: parseInt(limit) };

      const result = await productService.getProducts(filters, options);

      return res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching products",
        error: error.message,
      });
    }
  }

  // ========================
  // GET SINGLE PRODUCT
  // ========================

  /**
   * GET /api/v1/product/:id
   * Get a single product with full details
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const product = await productService.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching product",
        error: error.message,
      });
    }
  }

  // ========================
  // UPDATE PRODUCT
  // ========================

  /**
   * PUT /api/v1/product/:id
   * Update a product
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await productService.updateProduct(id, updateData);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error updating product:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((e) => e.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error updating product",
        error: error.message,
      });
    }
  }

  // ========================
  // DELETE PRODUCT
  // ========================

  /**
   * DELETE /api/v1/product/:id
   * Delete a product
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const result = await productService.deleteProduct(id, user);

      if (!result.success) {
        const statusCode = result.message === "Product not found" ? 404 : 403;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting product",
        error: error.message,
      });
    }
  }

  // ========================
  // FILTER OPTIONS
  // ========================

  /**
   * POST /api/v1/product/filter
   * Get filter options with counts for faceted search
   */
  async getFilterOptions(req, res) {
    try {
      const currentFilters = req.body || {};

      const filterOptions = await productService.getFilterOptions(currentFilters);

      return res.status(200).json({
        success: true,
        message: "Filter options retrieved successfully",
        data: filterOptions,
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching filter options",
        error: error.message,
      });
    }
  }
}

export default new ProductController();
