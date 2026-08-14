import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_localconnect';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_delivery_otp';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'user_public_key_example';

/**
 * Sends a Delivery OTP email using EmailJS from the frontend.
 * @param {Object} params
 * @param {string} params.toEmail Buyer's email
 * @param {string} params.toName Buyer's name
 * @param {string} params.otpCode Plain 6-digit OTP code
 * @param {number|string} params.orderId Order ID
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendOtpEmail = async ({ toEmail, toName, otpCode, orderId }) => {
  try {
    const templateParams = {
      to_email: toEmail,
      to_name: toName || 'Valued Customer',
      otp_code: otpCode,
      order_id: orderId,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
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
