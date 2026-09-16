/**
 * WhatsApp Utility Functions & Message Templates
 */

export function formatToWhatsAppJid(phone: string): string {
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0 (e.g. 09876543210), strip the leading 0
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits, assume Indian mobile number (+91)
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }

  return `${cleaned}@s.whatsapp.net`;
}

export function cleanPhoneDisplay(rawJidOrPhone: string): string {
  if (!rawJidOrPhone) return "";
  // 1. Remove domain (@s.whatsapp.net, @lid, etc.)
  const withoutDomain = rawJidOrPhone.split("@")[0];
  // 2. Remove multi-device index suffix (:22, :0, :1, etc.)
  const withoutDevice = withoutDomain.split(":")[0];
  // 3. Extract purely digits
  const digits = withoutDevice.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+${digits}`;
}

export const WHATSAPP_TEMPLATES = [
  {
    id: "order_confirmed",
    name: "Order Confirmed",
    template: (orderId = "1001", customerName = "Customer", amount = "450") =>
      `Namaste ${customerName}! 🙏\n\nYour Kollimalai Arasan order *#${orderId}* for *₹${amount}* has been confirmed and is being packed! 🌿✨\n\nWe will notify you as soon as it is dispatched.\n\nThank you for choosing Kollimalai Arasan! ❤️`,
  },
  {
    id: "out_for_delivery",
    name: "Out for Delivery",
    template: (orderId = "1001", customerName = "Customer") =>
      `Hello ${customerName}! 🚚\n\nGreat news! Your Kollimalai Arasan order *#${orderId}* is out for delivery. Our delivery partner will reach you shortly.\n\nEnjoy pure and authentic Kolli Hills products! 🌿`,
  },
  {
    id: "order_delivered",
    name: "Order Delivered",
    template: (orderId = "1001", customerName = "Customer") =>
      `Dear ${customerName}, your Kollimalai Arasan order *#${orderId}* has been delivered successfully! 🎉\n\nWe hope you love the authentic quality! If you have any feedback, please reply directly to this message.\n\nHave a healthy and wonderful day! ❤️`,
  },
  {
    id: "payment_reminder",
    name: "Payment Reminder",
    template: (orderId = "1001", customerName = "Customer", amount = "450") =>
      `Hello ${customerName},\n\nThis is a friendly reminder regarding your pending payment of *₹${amount}* for Kollimalai Arasan order *#${orderId}*.\n\nPlease complete your payment using UPI/card or contact us for assistance. Thank you! 🙏`,
  },
];
