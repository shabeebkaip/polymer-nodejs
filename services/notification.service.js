import Notification from "../models/notification.js";
import sendMail from "../utils/senMail.js";

class NotificationService {
  /**
   * Create in-app notification
   */
  async createNotification({ userId, type, message, redirectUrl, relatedId, meta }) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        message,
        redirectUrl,
        relatedId,
        meta,
      });
      
      console.log(`📬 Notification created for user ${userId}: ${message}`);
      return notification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, html, fallbackText }) {
    try {
      await sendMail({ to, subject, html });
      console.log(`📧 Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      // Don't throw - email failure shouldn't break the main flow
    }
  }

  /**
   * Notify seller when buyer creates a deal quote request
   */
  async notifySellerNewRequest({ seller, buyer, deal, request }) {
    const productName = deal?.productId?.productName || deal?.title || "a deal";
    
    // Create in-app notification
    await this.createNotification({
      userId: seller._id,
      type: "quote-enquiry",
      message: `New deal quote request from ${buyer.firstName} ${buyer.lastName} for ${productName}`,
      redirectUrl: `/seller/deal-requests/${request._id}`,
      relatedId: request._id,
      meta: {
        buyerId: buyer._id,
        dealId: deal._id,
        quantity: request.desiredQuantity,
      },
    });

    // Send email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Deal Quote Request</h2>
        <p>Hello ${seller.firstName},</p>
        <p>You have received a new quote request:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #3498db;">${productName}</h3>
          <p><strong>From:</strong> ${buyer.firstName} ${buyer.lastName}</p>
          <p><strong>Company:</strong> ${buyer.company || "N/A"}</p>
          <p><strong>Quantity:</strong> ${request.desiredQuantity}</p>
          <p><strong>Shipping:</strong> ${request.shippingCountry}</p>
          <p><strong>Delivery Deadline:</strong> ${request.deliveryDeadline ? new Date(request.deliveryDeadline).toLocaleDateString() : "Not specified"}</p>
          ${request.message ? `<p><strong>Message:</strong> ${request.message}</p>` : ""}
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.BASE_URL || "http://localhost:3000"}/seller/deal-requests/${request._id}" 
             style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Request & Respond
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Polymer Hub. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: seller.email,
      subject: `New Quote Request: ${productName}`,
      html: emailHtml,
    });
  }

  /**
   * Notify buyer when seller responds with quotation
   */
  async notifyBuyerQuotationReceived({ buyer, seller, deal, request, quotation }) {
    const productName = deal?.productId?.productName || deal?.title || "your request";
    
    // Create in-app notification
    await this.createNotification({
      userId: buyer._id,
      type: "quote-status",
      message: `${seller.firstName} ${seller.lastName} sent you a quotation for ${productName}`,
      redirectUrl: `/buyer/deal-requests/${request._id}`,
      relatedId: request._id,
      meta: {
        sellerId: seller._id,
        dealId: deal._id,
        quotedPrice: quotation.quotedPrice,
      },
    });

    // Send email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Quotation Received!</h2>
        <p>Hello ${buyer.firstName},</p>
        <p>${seller.firstName} ${seller.lastName} has responded to your quote request:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #27ae60;">${productName}</h3>
          <p><strong>Supplier:</strong> ${seller.firstName} ${seller.lastName}</p>
          <p><strong>Company:</strong> ${seller.company || "N/A"}</p>
          <p><strong>Quoted Price:</strong> $${quotation.quotedPrice}</p>
          <p><strong>Quantity:</strong> ${quotation.quotedQuantity}</p>
          <p><strong>Estimated Delivery:</strong> ${quotation.estimatedDelivery ? new Date(quotation.estimatedDelivery).toLocaleDateString() : "Not specified"}</p>
          ${quotation.message ? `<p><strong>Message:</strong> ${quotation.message}</p>` : ""}
          ${quotation.quotationDocument ? `<p><strong>📎 Quotation document attached</strong></p>` : ""}
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.BASE_URL || "http://localhost:3000"}/buyer/deal-requests/${request._id}" 
             style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Quotation
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Polymer Hub. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: buyer.email,
      subject: `Quotation Received: ${productName}`,
      html: emailHtml,
    });
  }

  /**
   * Notify buyer when status is updated
   */
  async notifyBuyerStatusUpdate({ buyer, seller, deal, request, oldStatus, newStatus, message }) {
    const productName = deal?.productId?.productName || deal?.title || "your request";
    
    const statusMessages = {
      accepted: "accepted your quote request",
      rejected: "rejected your quote request",
      in_progress: "started processing your order",
      shipped: "shipped your order",
      delivered: "confirmed delivery of your order",
      completed: "marked your order as completed",
      cancelled: "cancelled the request",
    };

    const notificationMessage = `${seller.firstName} ${seller.lastName} ${statusMessages[newStatus] || "updated the status"} for ${productName}`;
    
    // Create in-app notification
    await this.createNotification({
      userId: buyer._id,
      type: "quote-status",
      message: notificationMessage,
      redirectUrl: `/buyer/deal-requests/${request._id}`,
      relatedId: request._id,
      meta: {
        sellerId: seller._id,
        dealId: deal._id,
        oldStatus,
        newStatus,
      },
    });

    // Send email notification
    const statusColors = {
      accepted: "#27ae60",
      rejected: "#e74c3c",
      in_progress: "#3498db",
      shipped: "#9b59b6",
      delivered: "#16a085",
      completed: "#27ae60",
      cancelled: "#95a5a6",
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColors[newStatus] || "#2c3e50"};">Status Update: ${newStatus.replace('_', ' ').toUpperCase()}</h2>
        <p>Hello ${buyer.firstName},</p>
        <p>${notificationMessage}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${productName}</h3>
          <p><strong>Previous Status:</strong> <span style="color: #95a5a6;">${oldStatus}</span></p>
          <p><strong>New Status:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: bold;">${newStatus}</span></p>
          ${message ? `<p><strong>Update Message:</strong> ${message}</p>` : ""}
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.BASE_URL || "http://localhost:3000"}/buyer/deal-requests/${request._id}" 
             style="background: ${statusColors[newStatus] || "#3498db"}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Details
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Polymer Hub. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: buyer.email,
      subject: `Order Update: ${newStatus.replace('_', ' ')} - ${productName}`,
      html: emailHtml,
    });
  }

  /**
   * Notify seller when buyer creates a sample request
   */
  async notifySellerNewSampleRequest({ seller, buyerId, product, request }) {
    const productName = product?.productName || "a product";
    
    // Create in-app notification
    await this.createNotification({
      userId: seller._id,
      type: "sample-enquiry",
      message: `New sample request for ${productName}`,
      redirectUrl: `/seller/sample-requests/${request._id}`,
      relatedId: request._id,
      meta: {
        buyerId,
        productId: product._id,
        quantity: request.quantity,
      },
    });

    // Send email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Sample Request</h2>
        <p>Hello ${seller.firstName},</p>
        <p>You have received a new sample request:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #3498db;">${productName}</h3>
          <p><strong>Sample Size:</strong> ${request.sampleSize || "Not specified"}</p>
          <p><strong>Quantity:</strong> ${request.quantity} ${request.uom}</p>
          <p><strong>Application:</strong> ${request.application || "Not specified"}</p>
          <p><strong>Expected Annual Volume:</strong> ${request.expected_annual_volume || "Not specified"}</p>
          <p><strong>Shipping To:</strong> ${request.country}</p>
          ${request.message ? `<p><strong>Message:</strong> ${request.message}</p>` : ""}
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.BASE_URL || "http://localhost:3000"}/seller/sample-requests/${request._id}" 
             style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Request & Respond
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Polymer Hub. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: seller.email,
      subject: `New Sample Request: ${productName}`,
      html: emailHtml,
    });
  }

  /**
   * Notify buyer when sample request status is updated
   */
  async notifySampleStatusUpdate({ buyer, seller, product, request, oldStatus, newStatus }) {
    const productName = product?.productName || "your sample request";
    
    const statusMessages = {
      pending: "Your sample request is pending review",
      responded: "The supplier has responded to your sample request",
      sent: "Your sample has been shipped",
      delivered: "Your sample has been delivered",
      approved: "Your sample request has been approved",
      rejected: "Your sample request has been declined",
      cancelled: "Your sample request has been cancelled",
    };

    const statusColors = {
      pending: "#f39c12",
      responded: "#3498db",
      sent: "#9b59b6",
      delivered: "#27ae60",
      approved: "#27ae60",
      rejected: "#e74c3c",
      cancelled: "#95a5a6",
    };

    const notificationMessage = statusMessages[newStatus] || `Status updated to ${newStatus}`;
    
    // Create in-app notification
    await this.createNotification({
      userId: buyer._id,
      type: "sample-status",
      message: `${notificationMessage} for ${productName}`,
      redirectUrl: `/buyer/sample-requests/${request._id}`,
      relatedId: request._id,
      meta: {
        sellerId: seller._id,
        productId: product._id,
        oldStatus,
        newStatus,
      },
    });

    // Send email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColors[newStatus] || "#2c3e50"};">Sample Status Update: ${newStatus.replace('_', ' ').toUpperCase()}</h2>
        <p>Hello ${buyer.firstName},</p>
        <p>${notificationMessage}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${productName}</h3>
          <p><strong>Previous Status:</strong> <span style="color: #95a5a6;">${oldStatus}</span></p>
          <p><strong>New Status:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: bold;">${newStatus}</span></p>
          <p><strong>Supplier:</strong> ${seller.firstName} ${seller.lastName}</p>
          <p><strong>Company:</strong> ${seller.company || "N/A"}</p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.BASE_URL || "http://localhost:3000"}/buyer/sample-requests/${request._id}" 
             style="background: ${statusColors[newStatus] || "#3498db"}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Details
          </a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Polymer Hub. Please do not reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: buyer.email,
      subject: `Sample Status Update: ${newStatus.replace('_', ' ')} - ${productName}`,
      html: emailHtml,
    });
  }
}

export default new NotificationService();
