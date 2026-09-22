import Razorpay from "razorpay";

export function getRazorpayClient(): Razorpay {
  let key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay API credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the environment."
    );
  }

  // Ensure prefix is lowercase (rzp_test_ or rzp_live_)
  if (key_id.startsWith("Rzp_")) {
    key_id = "rzp_" + key_id.slice(4);
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

export function getRazorpayPublicKey(): string {
  let key_id = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID)?.trim();
  if (!key_id) {
    throw new Error("Razorpay Public Key ID is not configured.");
  }
  if (key_id.startsWith("Rzp_")) {
    key_id = "rzp_" + key_id.slice(4);
  }
  return key_id;
}
