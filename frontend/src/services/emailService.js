import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_localconnect';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'user_public_key_example';

// Template IDs from Environment
const TEMPLATE_DELIVERY_OTP = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_delivery_otp';
const TEMPLATE_ORDER_PLACED = import.meta.env.VITE_EMAILJS_TEMPLATE_ORDER_PLACED || 'template_order_placed';
const TEMPLATE_ORDER_DELIVERED = import.meta.env.VITE_EMAILJS_TEMPLATE_ORDER_DELIVERED || 'template_order_delivered';
const TEMPLATE_STORE_APPROVED = import.meta.env.VITE_EMAILJS_TEMPLATE_STORE_APPROVED || 'template_store_approved';

/**
 * Helper to determine whether real EmailJS credentials have been supplied by the user,
 * or if the client should gracefully simulate/mock the email in development/demo mode.
 */
const isEmailJsConfigured = (templateId) => {
  const isKeyReal = PUBLIC_KEY && PUBLIC_KEY.trim() !== '' && PUBLIC_KEY !== 'user_public_key_example';
  const isServiceReal = SERVICE_ID && SERVICE_ID.trim() !== '' && SERVICE_ID !== 'service_localconnect';
  const isTemplateReal = templateId && templateId.trim() !== '' && !templateId.startsWith('template_example');
  return Boolean(isKeyReal && isServiceReal && isTemplateReal);
};

/**
 * 1. Delivery OTP Email (Buyer) — Triggered when order status becomes OUT_FOR_DELIVERY
 * @param {Object} params
 * @param {string} params.toEmail Buyer's email
 * @param {string} params.toName Buyer's name
 * @param {string} params.otpCode Plain 6-digit OTP code
 * @param {number|string} params.orderId Order ID
 * @returns {Promise<{success: boolean, message?: string, error?: string, mocked?: boolean}>}
 */
export const sendOtpEmail = async ({ toEmail, toName, otpCode, orderId }) => {
  const templateParams = {
    to_email: toEmail,
    to_name: toName || 'Valued Customer',
    otp_code: otpCode,
    order_id: orderId,
  };

  if (!isEmailJsConfigured(TEMPLATE_DELIVERY_OTP)) {
    console.info(`[EmailJS Mock] 📦 Delivery OTP Email to ${toEmail}:`, templateParams);
    return {
      success: true,
      mocked: true,
      message: `Delivery OTP (${otpCode}) simulated for ${toEmail}`,
    };
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_DELIVERY_OTP,
      templateParams,
      PUBLIC_KEY
    );

    return {
      success: true,
      message: `OTP sent successfully to ${toEmail}`,
      response,
    };
  } catch (error) {
    console.error('Failed to send OTP via EmailJS:', error);
    return {
      success: false,
      error: error.text || error.message || 'Failed to send OTP email via EmailJS',
    };
  }
};

/**
 * 2. Order Placed Email (Buyer) — Triggered immediately after checkout
 * @param {Object} params
 * @param {string} params.toEmail Buyer's email
 * @param {string} params.toName Buyer's name
 * @param {number|string} params.orderId Order ID or Group ID
 * @param {string|Array} params.items Summary of items or array
 * @param {string|number} params.totalAmount Total amount formatted with currency
 * @param {string} params.deliveryAddress Delivery address
 * @param {string} [params.trackingLink] URL to track the order
 * @returns {Promise<{success: boolean, message?: string, error?: string, mocked?: boolean}>}
 */
export const sendOrderPlacedEmail = async ({
  toEmail,
  toName,
  orderId,
  items,
  totalAmount,
  deliveryAddress,
  trackingLink,
}) => {
  const itemsText = Array.isArray(items)
    ? items.map((i) => `${i.quantity}x ${i.title || i.productTitle} (₹${i.price || i.totalPrice})`).join(', ')
    : String(items || 'Mohalla marketplace order items');

  const defaultTrackingLink = trackingLink || `${window.location.origin}/orders`;

  const templateParams = {
    to_email: toEmail,
    to_name: toName || 'Valued Customer',
    order_id: orderId,
    items_summary: itemsText,
    total_amount: typeof totalAmount === 'number' ? `₹${totalAmount.toFixed(2)}` : String(totalAmount),
    delivery_address: deliveryAddress || 'Mohalla Doorstep Delivery',
    tracking_link: defaultTrackingLink,
  };

  if (!isEmailJsConfigured(TEMPLATE_ORDER_PLACED)) {
    console.info(`[EmailJS Mock] 🛒 Order Placed Email to ${toEmail}:`, templateParams);
    return {
      success: true,
      mocked: true,
      message: `Order confirmation simulated for ${toEmail}`,
    };
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ORDER_PLACED,
      templateParams,
      PUBLIC_KEY
    );

    return {
      success: true,
      message: `Order confirmation sent to ${toEmail}`,
      response,
    };
  } catch (error) {
    console.error('Failed to send Order Placed email via EmailJS:', error);
    return {
      success: false,
      error: error.text || error.message || 'Failed to send order confirmation email via EmailJS',
    };
  }
};

/**
 * 3. Order Delivered Email (Buyer) — Triggered when seller verifies OTP & status becomes DELIVERED
 * @param {Object} params
 * @param {string} params.toEmail Buyer's email
 * @param {string} params.toName Buyer's name
 * @param {number|string} params.orderId Order ID
 * @param {string} [params.productTitle] Title of delivered product
 * @param {string} [params.reviewLink] Link to review the product
 * @returns {Promise<{success: boolean, message?: string, error?: string, mocked?: boolean}>}
 */
export const sendOrderDeliveredEmail = async ({
  toEmail,
  toName,
  orderId,
  productTitle,
  reviewLink,
}) => {
  const defaultReviewLink = reviewLink || `${window.location.origin}/orders/${orderId}`;

  const templateParams = {
    to_email: toEmail,
    to_name: toName || 'Valued Customer',
    order_id: orderId,
    product_title: productTitle || 'Handcrafted Order',
    review_link: defaultReviewLink,
  };

  if (!isEmailJsConfigured(TEMPLATE_ORDER_DELIVERED)) {
    console.info(`[EmailJS Mock] 🎉 Order Delivered Email to ${toEmail}:`, templateParams);
    return {
      success: true,
      mocked: true,
      message: `Delivery receipt & review invitation simulated for ${toEmail}`,
    };
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ORDER_DELIVERED,
      templateParams,
      PUBLIC_KEY
    );

    return {
      success: true,
      message: `Delivery confirmation sent to ${toEmail}`,
      response,
    };
  } catch (error) {
    console.error('Failed to send Order Delivered email via EmailJS:', error);
    return {
      success: false,
      error: error.text || error.message || 'Failed to send delivery email via EmailJS',
    };
  }
};

/**
 * 4. Store Approved Email (Seller) — Triggered when Admin approves pending store
 * @param {Object} params
 * @param {string} params.toEmail Seller's email
 * @param {string} params.toName Seller/owner's name
 * @param {string} params.storeName Name of approved workshop/store
 * @param {string} [params.dashboardLink] Link to Seller Dashboard
 * @returns {Promise<{success: boolean, message?: string, error?: string, mocked?: boolean}>}
 */
export const sendStoreApprovedEmail = async ({
  toEmail,
  toName,
  storeName,
  dashboardLink,
}) => {
  const defaultDashboardLink = dashboardLink || `${window.location.origin}/dashboard`;

  const templateParams = {
    to_email: toEmail,
    to_name: toName || 'Mohalla Artisan',
    store_name: storeName || 'Your Mohalla Store',
    dashboard_link: defaultDashboardLink,
  };

  if (!isEmailJsConfigured(TEMPLATE_STORE_APPROVED)) {
    console.info(`[EmailJS Mock] 🏪 Store Approved Email to ${toEmail}:`, templateParams);
    return {
      success: true,
      mocked: true,
      message: `Store approval congratulations simulated for ${toEmail}`,
    };
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_STORE_APPROVED,
      templateParams,
      PUBLIC_KEY
    );

    return {
      success: true,
      message: `Store approval notification sent to ${toEmail}`,
      response,
    };
  } catch (error) {
    console.error('Failed to send Store Approved email via EmailJS:', error);
    return {
      success: false,
      error: error.text || error.message || 'Failed to send store approval email via EmailJS',
    };
  }
};
