export const LOGOS = {
  logo: "/logos/logo.svg",
  hero_banner: "/logos/hero_banner.jpg",
  banner: "/logos/banner.svg",
  CategorySection: "/logos/explore_category.svg",
  flower: "/logos/flower_image.svg",
  wishlist: "/logos/wishlist.svg",
};



export const ICONS = {
  cart: "/icons/cart.svg",
  search: "/icons/Search.svg",
  user: "/icons/user.svg",
  wishlist: "/icons/wishlist.svg",
  wishlist_red: "/icons/wishlist_red.svg",
  view_all: "/icons/view_all.svg",
  drop_icon: "/icons/drop_icon.svg",
  menu: "/icons/menu.svg",
  rightButton: "/icons/right_button.svg",
  leftButton: "/icons/left_button.svg",
  helpLine: "/icons/helpline.svg",
  delivery: "/icons/delivery_icon.svg",
  payment: "/icons/payment.svg",
  quality: "/icons/quality.svg",
  season: "/icons/season.svg",
  shipping: "/icons/shipping.svg",
  call: "/icons/call.svg",
  whatsapp: "/icons/whatsapp.svg",
  mail: "/icons/mail.svg",
  location: "/icons/location.svg",
  facebook: "/icons/facebook.svg",
  instagram: "/icons/instagram.svg",
  youtube: "/icons/youtube.svg",
  whatsapp1: "/icons/whatsapp1.svg",
  leaf: "/icons/leaf.svg",
  badge: "/icons/verified-badge.svg",
  box: "/icons/box-icon.svg",
};





export const PHOTOS = {
  photo1: "/photos/photo1.svg",
  photo2: "/photos/photo2.svg",
  photo3: "/photos/photo3.svg",
};

export const banners = [
  LOGOS.hero_banner,

];



export const features = [
  {
    id: 1,
    image: ICONS.delivery,
    name: "Free Delivery",
    footer: "For all orders over ₹3500",
  },
  {
    id: 2,
    image: ICONS.payment,
    name: "Safe Payment",
    footer: "100% secure payment",
  },
  {
    id: 3,
    image: ICONS.quality,
    name: "Shop With Confidence",
    footer: "Safe and Secure Environment",
  },
  {
    id: 4,
    image: ICONS.whatsapp,
    name: "Dedicated Help Center",
    footer: "IST 8:30 AM to 8:30 PM",
  },
];

export const contacts = [
  {
    id: 1,
    icon: ICONS.call,
    title: "Call",
    value: "+91 74181 88950",
    link: "tel:+917418188950",
  },
  {
    id: 2,
    icon: ICONS.whatsapp,
    title: "WhatsApp",
    value: "+91 73388 80950",
    link: "https://wa.me/917338880950",
  },
  {
    id: 3,
    icon: ICONS.mail,
    title: "Mail",
    value: "contact@kollimalaiarasan.com",
    link: "mailto:contact@kollimalaiarasan.com",
  },
];

export interface FooterSocialIcon {
  id: number;
  icon: string;
  name: string;
  /** Profile URL. "#" until the real handles are supplied. */
  href: string;
}

export const footerSocialIcons: FooterSocialIcon[] = [
  { id: 1, icon: ICONS.facebook, name: "facebook", href: "https://www.facebook.com/share/18fDBEXh18/" },
  { id: 2, icon: ICONS.instagram, name: "instagram", href: "#" },
  { id: 3, icon: ICONS.youtube, name: "youtube", href: "https://youtube.com/@kollimalaiarasan?si=CMvlWG_zegPDyt5O" },
  { id: 4, icon: ICONS.whatsapp1, name: "whatsapp", href: "https://wa.me/917338880950" },
];

export const readyToAssist = [
  { label: "Track My Order", href: "/orders" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Return & Refund Policy", href: "/return-refund-policy" },
  { label: "FAQ's", href: "/faqs" },
] as const;



export const reviews = [
  {
    id: 1,
    image: PHOTOS.photo1,
    name: "Mrs. Kavi P.,",
    location: "Namakkal, Tamil Nadu",
    feedback:
      "Kollimalai Arasan spices are extraordinarily pure and aromatic. The black pepper and green cardamom have an authentic mountain aroma that you simply cannot find in regular markets!",
    bg: "--red-50",
  },
  {
    id: 2,
    image: PHOTOS.photo2,
    name: "Mr. Muni K.,",
    location: "Salem, Tamil Nadu",
    bg: "--green-50",
    feedback:
      "Fresh, authentic, and naturally grown produce directly from Kolli Hills. The cloves and traditional hill harvests are unmatched in quality and freshness.",
  },
  {
    id: 3,
    image: PHOTOS.photo3,
    name: "Mrs. Thenmozhi A.,",
    location: "Chennai, Tamil Nadu",
    bg: "--blue-50",
    feedback:
      "The finest whole spices I've ordered online. Pure, organic Kolli Hills black pepper and aromatic cardamom. Excellent packaging and prompt delivery!",
  },
];

export const navigation = [
  { id: 1, text: "Home", path: "/" },
  // Categories hang off this entry - the drawer expands it into the live
  // category list, mirroring the "Shop All" dropdown on desktop.
  { id: 2, text: "Shop All", path: "/products", icon: ICONS.drop_icon },
  { id: 3, text: "About Us", path: "/about" },
  { id: 4, text: "Contact", path: "/contact" },
];

export const desktopIcons = [
  { id: 1, icon: ICONS.search, alt: "search", path: "/search" },
  { id: 2, icon: ICONS.wishlist, alt: "wishlist", path: "/wishlist" },
  { id: 3, icon: ICONS.cart, alt: "cart", path: "/cart" },
  { id: 4, icon: ICONS.user, alt: "user", path: "/profile" },
];

export const mobileBottomIcons = [
  { id: 1, icon: ICONS.search, text: "Search", path: "/search" },
  { id: 2, icon: ICONS.wishlist, text: "Wishlist", path: "/wishlist" },
  { id: 3, icon: ICONS.cart, text: "Cart", path: "/cart" },
  { id: 4, icon: ICONS.user, text: "Account", path: "/profile" },
];

/**
 * A single sellable pack size for a storefront item, e.g. "250 g" @ Rs.99.
 * `sellingPrice` is what should be shown/charged; it already accounts for
 * any active offer/discount (currently identical to basePrice since no
 * offer engine is wired up for the storefront - see computeSellingPrice in
 * the customer catalog repository). `id` is the VariantUnitPrice UUID and
 * is what the cart/wishlist APIs actually key off.
 */
export interface StorefrontUnitPrice {
  id: string;
  label: string;
  sku: string;
  basePrice: number;
  sellingPrice: number;
  isDefault: boolean;
}

/**
 * A single storefront item card. This corresponds to one ProductVariant
 * (e.g. "Mango Mysore Pak"), which can have any number of independently
 * priced pack sizes (unitPrices) - not a fixed 50g/100g pair.
 */
export interface StorefrontProduct {
  id: string; // ProductVariant UUID (item-level)
  productId: string; // Parent Product UUID (e.g. "Mysore Paks")
  name: string;
  image: string;
  outOfStock?: boolean;
  isDefault?: boolean;
  unitPrices: StorefrontUnitPrice[];
}
