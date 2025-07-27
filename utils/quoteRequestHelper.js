// Migration utilities and helper functions for UnifiedQuoteRequest

export class QuoteRequestHelper {
  
  /**
   * Create a product quote request
   */
  static createProductQuote(data) {
    return {
      requestType: "product_quote",
      buyerId: data.buyerId || data.user, // Support both field names
      product: data.product,
      quantity: parseInt(data.quantity), // Ensure number
      uom: data.uom,
      country: data.country,
      destination: data.destination,
      delivery_date: data.delivery_date,
      grade: data.grade,
      incoterm: data.incoterm,
      packagingType: data.packagingType,
      packaging_size: data.packaging_size,
      expected_annual_volume: data.expected_annual_volume ? parseInt(data.expected_annual_volume) : undefined,
      application: data.application,
      message: data.message,
      price: data.price || data.pricing, // Handle both field names
      lead_time: data.lead_time,
      terms: data.terms,
      request_document: data.request_document,
      open_request: data.open_request,
      sourceSection: data.sourceSection || "product_detail"
    };
  }
  
  /**
   * Create a deal quote request
   */
  static createDealQuote(data) {
    return {
      requestType: "deal_quote",
      buyerId: data.buyerId,
      bestDealId: data.bestDealId,
      sellerId: data.sellerId, // <-- FIX: ensure sellerId is set
      desiredQuantity: data.desiredQuantity,
      quantity: data.desiredQuantity, // For unified access
      shippingCountry: data.shippingCountry,
      paymentTerms: data.paymentTerms,
      deliveryDeadline: data.deliveryDeadline,
      message: data.message,
      sourceSection: "special_offers"
    };
  }
  
  /**
   * Get all quote requests with unified formatting
   */
  static async getAllQuoteRequests(filters = {}, populate = true) {
    const UnifiedQuoteRequest = (await import('../models/unifiedQuoteRequest.js')).default;
    
    let query = UnifiedQuoteRequest.find(filters);
    
    if (populate) {
      query = query
        .populate('buyerId', 'firstName lastName email company phone')
        .populate('product', 'productName chemicalName tradeName')
        .populate('bestDealId', 'title description dealPrice originalPrice');
    }
    
    const requests = await query.sort({ createdAt: -1 });
    
    return requests.map(req => this.formatUnifiedResponse(req));
  }
  
  /**
   * Format response for unified display
   */
  static formatUnifiedResponse(request) {
    const obj = request.toObject();
    console.log("🔶 Quote Request Helper - Formatting response:", obj);
    return {
      ...obj,
      // Unified fields for easier frontend handling
      unified: {
        type: obj.requestType,
        title: obj.requestType === 'product_quote' 
          ? obj.product?.productName 
          : obj.bestDealId?.productId?.productName,
        quantity: obj.quantity || obj.desiredQuantity,
        deliveryDate: obj.delivery_date || obj.deliveryDeadline,
        location: obj.country || obj.shippingCountry,
        destination: obj.destination || obj.shippingCountry,
        isProductQuote: obj.requestType === 'product_quote',
        isDealQuote: obj.requestType === 'deal_quote',
        statusIcon: this.getStatusIcon(obj.status),
        priorityLevel: this.getPriorityLevel(obj.delivery_date || obj.deliveryDeadline)
      }
    };
  }
  
  /**
   * Get status icon for UI
   */
  static getStatusIcon(status) {
    const icons = {
      pending: '⏳',
      responded: '💬',
      negotiation: '🤝',
      accepted: '✅',
      in_progress: '🔄',
      shipped: '🚚',
      delivered: '📦',
      completed: '🎉',
      rejected: '❌',
      cancelled: '🚫'
    };
    return icons[status] || '❓';
  }
  
  /**
   * Get priority level based on delivery date
   */
  static getPriorityLevel(deliveryDate) {
    if (!deliveryDate) return 'normal';
    
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const daysUntilDelivery = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDelivery <= 7) return 'urgent';
    if (daysUntilDelivery <= 14) return 'high';
    if (daysUntilDelivery <= 30) return 'medium';
    return 'normal';
  }
  
  /**
   * Migrate existing data (run once)
   */
  static async migrateExistingData() {
    const QuoteRequest = (await import('../models/quoteRequest.js')).default;
    const DealQuoteRequest = (await import('../models/dealQuoteRequest.js')).default;
    const UnifiedQuoteRequest = (await import('../models/unifiedQuoteRequest.js')).default;
    
    try {
      // Migrate product quotes
      const productQuotes = await QuoteRequest.find();
      for (const quote of productQuotes) {
        const unifiedData = this.createProductQuote(quote.toObject());
        await new UnifiedQuoteRequest(unifiedData).save();
      }
      
      // Migrate deal quotes
      const dealQuotes = await DealQuoteRequest.find();
      for (const quote of dealQuotes) {
        const unifiedData = this.createDealQuote(quote.toObject());
        await new UnifiedQuoteRequest(unifiedData).save();
      }
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

export default QuoteRequestHelper;
