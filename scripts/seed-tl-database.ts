import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

const CATEGORIES_DATA = [
  {
    name: "Pakoda & Savories",
    slug: "pakoda-savories",
    description: "Crunchy tea-time cashew pakodas, ribbon sev, spicy omapodi, and evening munchies.",
    products: [
      {
        name: "Cashew Pakoda (Mundhiri Pakoda)",
        slug: "cashew-pakoda",
        description: "Decadent whole cashews coated in seasoned gram flour batter, deep-fried to golden perfection.",
        variants: [
          { name: "Cashew Pakoda (Mundhiri Pakoda)", price200: 195, price500: 450, sku: "CP-ORIG", img: "/logos/cashew_pakoda.png" },
          { name: "Spicy Masala Cashew Pakoda", price200: 205, price500: 470, sku: "CP-SPICY", img: "/logos/cashew_pakoda.png" },
          { name: "Garlic Roasted Cashew Pakoda", price200: 210, price500: 480, sku: "CP-GARLIC", img: "/logos/cashew_pakoda.png" },
          { name: "Black Pepper Cashew Pakoda", price200: 215, price500: 490, sku: "CP-PEPPER", img: "/logos/cashew_pakoda.png" },
          { name: "Pure Desi Ghee Cashew Pakoda", price200: 235, price500: 540, sku: "CP-GHEE", img: "/logos/cashew_pakoda.png" },
          { name: "Curry Leaf Crisp Cashew Pakoda", price200: 200, price500: 460, sku: "CP-CURRY", img: "/logos/cashew_pakoda.png" },
          { name: "Pudina Mint Cashew Pakoda", price200: 205, price500: 470, sku: "CP-PUDINA", img: "/logos/cashew_pakoda.png" },
          { name: "Peri Peri Cashew Pakoda", price200: 210, price500: 480, sku: "CP-PERI", img: "/logos/cashew_pakoda.png" },
          { name: "Andhra Guntur Chilli Cashew Pakoda", price200: 220, price500: 500, sku: "CP-ANDHRA", img: "/logos/cashew_pakoda.png" },
        ],
      },
      {
        name: "Ribbon Pakoda (Ola Pakoda)",
        slug: "ribbon-pakoda",
        description: "Classic flat ribbon-shaped savory crisps crafted with rice flour, gram flour, cumin, and hing.",
        variants: [
          { name: "Ribbon Pakoda (Ola Pakoda)", price200: 110, price500: 260, sku: "RP-ORIG", img: "/logos/ribbon_pakoda.png" },
          { name: "Spicy Red Chilli Ribbon Pakoda", price200: 115, price500: 270, sku: "RP-SPICY", img: "/logos/ribbon_pakoda.png" },
          { name: "Poondu (Garlic) Ribbon Pakoda", price200: 120, price500: 280, sku: "RP-GARLIC", img: "/logos/ribbon_pakoda.png" },
          { name: "Butter Ribbon Pakoda", price200: 130, price500: 300, sku: "RP-BUTTER", img: "/logos/ribbon_pakoda.png" },
          { name: "Jeera Cumin Ribbon Pakoda", price200: 115, price500: 270, sku: "RP-JEERA", img: "/logos/ribbon_pakoda.png" },
          { name: "Curry Leaves Ribbon Pakoda", price200: 120, price500: 280, sku: "RP-CURRY", img: "/logos/ribbon_pakoda.png" },
          { name: "Ajwain (Omam) Ribbon Pakoda", price200: 115, price500: 270, sku: "RP-AJWAIN", img: "/logos/ribbon_pakoda.png" },
          { name: "Millet (Kambu) Ribbon Pakoda", price200: 135, price500: 310, sku: "RP-KAMBU", img: "/logos/ribbon_pakoda.png" },
          { name: "Chettinad Pepper Ribbon Pakoda", price200: 125, price500: 290, sku: "RP-PEPPER", img: "/logos/ribbon_pakoda.png" },
        ],
      },
      {
        name: "Crispy Omapodi (Ajwain Sev)",
        slug: "crispy-omapodi",
        description: "Delicate and airy noodles infused with fragrant ajwain (carom seeds). Easy to digest and immensely flavorful.",
        variants: [
          { name: "Crispy Omapodi (Ajwain Sev)", price200: 100, price500: 240, sku: "OP-ORIG", img: "/logos/omapodi.png" },
          { name: "Spicy Garlic Omapodi", price200: 110, price500: 255, sku: "OP-GARLIC", img: "/logos/omapodi.png" },
          { name: "Butter Omapodi", price200: 125, price500: 290, sku: "OP-BUTTER", img: "/logos/omapodi.png" },
          { name: "Black Pepper Omapodi", price200: 115, price500: 265, sku: "OP-PEPPER", img: "/logos/omapodi.png" },
          { name: "Hing (Asafoetida) Omapodi", price200: 105, price500: 245, sku: "OP-HING", img: "/logos/omapodi.png" },
          { name: "Curry Leaf Roasted Omapodi", price200: 110, price500: 255, sku: "OP-CURRY", img: "/logos/omapodi.png" },
          { name: "Masala Peanut Sev", price200: 120, price500: 280, sku: "OP-PEANUT", img: "/logos/omapodi.png" },
          { name: "Kashmiri Chilli Omapodi", price200: 115, price500: 265, sku: "OP-KASHMIRI", img: "/logos/omapodi.png" },
          { name: "Ragi Millet Omapodi", price200: 130, price500: 300, sku: "OP-RAGI", img: "/logos/omapodi.png" },
        ],
      },
    ],
  },
  {
    name: "Traditional Murukku",
    slug: "traditional-murukku",
    description: "Handcrafted, crispy, golden-fried South Indian traditional murukku varieties made with pure rice and urad dal flour.",
    products: [
      {
        name: "Kai Murukku (Handcrafted)",
        slug: "kai-murukku",
        description: "Artisanally twisted by hand into spirals, carrying that unmistakable authentic festival crunch.",
        variants: [
          { name: "Kai Murukku (Traditional Handcrafted)", price200: 120, price500: 280, sku: "KM-ORIG", img: "/logos/kai_murukku.png" },
          { name: "Butter Kai Murukku (Vennai Murukku)", price200: 135, price500: 310, sku: "KM-BUTTER", img: "/logos/kai_murukku.png" },
          { name: "Garlic Kai Murukku", price200: 130, price500: 300, sku: "KM-GARLIC", img: "/logos/kai_murukku.png" },
          { name: "Black Sesame Kai Murukku", price200: 125, price500: 290, sku: "KM-SESAME", img: "/logos/kai_murukku.png" },
          { name: "Spicy Guntur Chilli Kai Murukku", price200: 130, price500: 300, sku: "KM-SPICY", img: "/logos/kai_murukku.png" },
          { name: "Cumin Seed (Jeera) Kai Murukku", price200: 125, price500: 290, sku: "KM-JEERA", img: "/logos/kai_murukku.png" },
          { name: "Pure Ghee Roast Kai Murukku", price200: 155, price500: 360, sku: "KM-GHEE", img: "/logos/kai_murukku.png" },
          { name: "Red Rice (Sigappu Arisi) Kai Murukku", price200: 140, price500: 320, sku: "KM-REDRICE", img: "/logos/kai_murukku.png" },
          { name: "Chettinad Pepper Kai Murukku", price200: 130, price500: 300, sku: "KM-PEPPER", img: "/logos/kai_murukku.png" },
        ],
      },
      {
        name: "Thenkuzhal Murukku",
        slug: "thenkuzhal-murukku",
        description: "Porous, melt-in-the-mouth tubular murukku prepared with top-grade raw rice and moong dal.",
        variants: [
          { name: "Classic Thenkuzhal Murukku", price200: 110, price500: 260, sku: "TM-ORIG", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Butter Thenkuzhal Murukku", price200: 125, price500: 290, sku: "TM-BUTTER", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Sesame (Ellu) Thenkuzhal", price200: 115, price500: 270, sku: "TM-ELLU", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Spicy Masala Thenkuzhal", price200: 120, price500: 280, sku: "TM-SPICY", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Poondu Garlic Thenkuzhal", price200: 125, price500: 290, sku: "TM-GARLIC", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Crushed Black Pepper Thenkuzhal", price200: 120, price500: 280, sku: "TM-PEPPER", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Pure Ghee Thenkuzhal", price200: 145, price500: 340, sku: "TM-GHEE", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Millet Multi-Grain Thenkuzhal", price200: 135, price500: 310, sku: "TM-MILLET", img: "/logos/thenkuzhal_murukku.png" },
          { name: "Hing Aroma Thenkuzhal", price200: 115, price500: 270, sku: "TM-HING", img: "/logos/thenkuzhal_murukku.png" },
        ],
      },
      {
        name: "Ring Murukku (Chegodilu)",
        slug: "ring-murukku",
        description: "Small ring-shaped crunchies tempered with sesame seeds and chili, beloved across Andhra and Tamil Nadu.",
        variants: [
          { name: "Classic Chegodilu Ring Murukku", price200: 105, price500: 250, sku: "RM-ORIG", img: "/logos/special_butter_murukku.png" },
          { name: "Andhra Hot Chegodilu", price200: 115, price500: 270, sku: "RM-HOT", img: "/logos/special_butter_murukku.png" },
          { name: "Garlic Chegodilu Ring", price200: 120, price500: 280, sku: "RM-GARLIC", img: "/logos/special_butter_murukku.png" },
          { name: "White Sesame Ring Murukku", price200: 110, price500: 260, sku: "RM-SESAME", img: "/logos/special_butter_murukku.png" },
          { name: "Butter Mini Rings", price200: 125, price500: 290, sku: "RM-BUTTER", img: "/logos/special_butter_murukku.png" },
          { name: "Pepper Crunch Rings", price200: 115, price500: 270, sku: "RM-PEPPER", img: "/logos/special_butter_murukku.png" },
          { name: "Ajwain Carom Ring Murukku", price200: 110, price500: 260, sku: "RM-AJWAIN", img: "/logos/special_butter_murukku.png" },
          { name: "Curry Leaves Chegodilu", price200: 115, price500: 270, sku: "RM-CURRY", img: "/logos/special_butter_murukku.png" },
          { name: "Peri Peri Chegodilu", price200: 120, price500: 280, sku: "RM-PERI", img: "/logos/special_butter_murukku.png" },
        ],
      },
    ],
  },
  {
    name: "Crispy Chips",
    slug: "crispy-chips",
    description: "Authentic Kerala Nendran banana chips, tapioca crisps, and seasonal jackfruit chips fried in pure coconut oil.",
    products: [
      {
        name: "Kerala Nendran Banana Chips",
        slug: "kerala-banana-chips",
        description: "Thin golden slices of premium Kerala Nendran bananas slow-fried in pure cold-pressed coconut oil with turmeric and sea salt.",
        variants: [
          { name: "Classic Salted Kerala Banana Chips", price200: 140, price500: 320, sku: "BC-SALT", img: "/logos/special_spicy_chips.png" },
          { name: "Spicy Masala Banana Chips", price200: 150, price500: 340, sku: "BC-SPICY", img: "/logos/special_spicy_chips.png" },
          { name: "Black Pepper Banana Chips", price200: 155, price500: 350, sku: "BC-PEPPER", img: "/logos/special_spicy_chips.png" },
          { name: "Sweet Jaggery Banana Chips (Sharkara Varatti)", price200: 160, price500: 370, sku: "BC-SHARKARA", img: "/logos/special_spicy_chips.png" },
          { name: "Garlic Herb Banana Chips", price200: 150, price500: 340, sku: "BC-GARLIC", img: "/logos/special_spicy_chips.png" },
          { name: "Four-Cut Thick Banana Chips", price200: 145, price500: 330, sku: "BC-THICK", img: "/logos/special_spicy_chips.png" },
          { name: "Peri Peri Banana Chips", price200: 155, price500: 350, sku: "BC-PERI", img: "/logos/special_spicy_chips.png" },
          { name: "Green Chilli Banana Chips", price200: 150, price500: 340, sku: "BC-CHILLI", img: "/logos/special_spicy_chips.png" },
          { name: "Lime & Mint Banana Chips", price200: 150, price500: 340, sku: "BC-LIME", img: "/logos/special_spicy_chips.png" },
        ],
      },
      {
        name: "Crispy Potato Chips",
        slug: "crispy-potato-chips",
        description: "Freshly sliced farm potatoes fried crispy with hand-blended artisanal spice mixes.",
        variants: [
          { name: "Classic Rock Salt Potato Chips", price200: 100, price500: 240, sku: "PC-SALT", img: "/logos/special_spicy_chips.png" },
          { name: "Hot & Tangy Masala Potato Chips", price200: 110, price500: 260, sku: "PC-MASALA", img: "/logos/special_spicy_chips.png" },
          { name: "Cream & Onion Potato Chips", price200: 115, price500: 270, sku: "PC-ONION", img: "/logos/special_spicy_chips.png" },
          { name: "Crushed Black Pepper Potato Chips", price200: 110, price500: 260, sku: "PC-PEPPER", img: "/logos/special_spicy_chips.png" },
          { name: "Fiery Red Chilli Potato Chips", price200: 110, price500: 260, sku: "PC-CHILLI", img: "/logos/special_spicy_chips.png" },
          { name: "Pudina Pudina Herb Potato Chips", price200: 115, price500: 270, sku: "PC-PUDINA", img: "/logos/special_spicy_chips.png" },
          { name: "Smoky Barbecue Potato Chips", price200: 120, price500: 280, sku: "PC-BBQ", img: "/logos/special_spicy_chips.png" },
          { name: "Chettinad Spiced Potato Chips", price200: 120, price500: 280, sku: "PC-CHETTINAD", img: "/logos/special_spicy_chips.png" },
          { name: "Wavy Cut Salt & Pepper Chips", price200: 115, price500: 270, sku: "PC-WAVY", img: "/logos/special_spicy_chips.png" },
        ],
      },
      {
        name: "Tapioca Crisps (Maravalli Kizhangu)",
        slug: "tapioca-crisps",
        description: "Crunchy sliced tapioca root chips fried to golden perfection with zesty South Indian seasoning.",
        variants: [
          { name: "Classic Salted Tapioca Chips", price200: 110, price500: 260, sku: "TC-SALT", img: "/logos/special_spicy_chips.png" },
          { name: "Fiery Chilli Tapioca Chips", price200: 120, price500: 280, sku: "TC-CHILLI", img: "/logos/special_spicy_chips.png" },
          { name: "Cracked Pepper Tapioca Chips", price200: 125, price500: 290, sku: "TC-PEPPER", img: "/logos/special_spicy_chips.png" },
          { name: "Masala Finger Cut Tapioca Chips", price200: 120, price500: 280, sku: "TC-FINGER", img: "/logos/special_spicy_chips.png" },
          { name: "Garlic Tapioca Chips", price200: 125, price500: 290, sku: "TC-GARLIC", img: "/logos/special_spicy_chips.png" },
          { name: "Curry Leaf Infused Tapioca Chips", price200: 120, price500: 280, sku: "TC-CURRY", img: "/logos/special_spicy_chips.png" },
          { name: "Peri Peri Tapioca Chips", price200: 130, price500: 300, sku: "TC-PERI", img: "/logos/special_spicy_chips.png" },
          { name: "Jeera Cumin Tapioca Chips", price200: 115, price500: 270, sku: "TC-JEERA", img: "/logos/special_spicy_chips.png" },
          { name: "Sweet & Spicy Tapioca Chips", price200: 125, price500: 290, sku: "TC-SWEETSPICY", img: "/logos/special_spicy_chips.png" },
        ],
      },
    ],
  },
  {
    name: "Authentic Mixtures",
    slug: "authentic-mixtures",
    description: "Savory Madras mixtures, boondi, and spiced snacks packed with roasted cashews, peanuts, and aromatic curry leaves.",
    products: [
      {
        name: "Madras Special Mixture",
        slug: "madras-mixture",
        description: "The crown jewel of tea-time snacking: a rich medley of sev, omapodi, boondi, roasted cashews, and peanuts.",
        variants: [
          { name: "Classic Madras Special Mixture", price200: 120, price500: 280, sku: "MM-ORIG", img: "/logos/mixture.png" },
          { name: "Royal Cashew Deluxe Mixture", price200: 165, price500: 390, sku: "MM-CASHEW", img: "/logos/mixture.png" },
          { name: "Spicy Kara Mixture", price200: 125, price500: 290, sku: "MM-SPICY", img: "/logos/mixture.png" },
          { name: "Garlic (Poondu) Mixture", price200: 130, price500: 300, sku: "MM-GARLIC", img: "/logos/mixture.png" },
          { name: "Corn Flakes Crispy Mixture", price200: 125, price500: 290, sku: "MM-CORN", img: "/logos/mixture.png" },
          { name: "Navratan Sweet & Savory Mixture", price200: 135, price500: 310, sku: "MM-NAVRATAN", img: "/logos/mixture.png" },
          { name: "Diet Roasted Poha Mixture", price200: 130, price500: 300, sku: "MM-POHA", img: "/logos/mixture.png" },
          { name: "Chettinad Pepper Mixture", price200: 130, price500: 300, sku: "MM-PEPPER", img: "/logos/mixture.png" },
          { name: "Millet Healthy Mixture", price200: 145, price500: 340, sku: "MM-MILLET", img: "/logos/mixture.png" },
        ],
      },
      {
        name: "Spicy Kara Boondi",
        slug: "spicy-kara-boondi",
        description: "Crunchy fried chickpea flour droplets tossed with roasted peanuts, cashews, curry leaves, and spicy red chilli.",
        variants: [
          { name: "Classic Hot Kara Boondi", price200: 100, price500: 240, sku: "KB-ORIG", img: "/logos/mixture.png" },
          { name: "Poondu Garlic Kara Boondi", price200: 110, price500: 260, sku: "KB-GARLIC", img: "/logos/mixture.png" },
          { name: "Cashew Butter Kara Boondi", price200: 140, price500: 330, sku: "KB-CASHEW", img: "/logos/mixture.png" },
          { name: "Andhra Guntur Spicy Boondi", price200: 115, price500: 270, sku: "KB-ANDHRA", img: "/logos/mixture.png" },
          { name: "Pepper Roasted Boondi", price200: 110, price500: 260, sku: "KB-PEPPER", img: "/logos/mixture.png" },
          { name: "Curry Leaf Crisp Boondi", price200: 105, price500: 250, sku: "KB-CURRY", img: "/logos/mixture.png" },
          { name: "Hing & Salt Mithi Boondi", price200: 105, price500: 250, sku: "KB-HING", img: "/logos/mixture.png" },
          { name: "Peanut Crunch Kara Boondi", price200: 110, price500: 260, sku: "KB-PEANUT", img: "/logos/mixture.png" },
          { name: "Peri Peri Tangy Boondi", price200: 115, price500: 270, sku: "KB-PERI", img: "/logos/mixture.png" },
        ],
      },
      {
        name: "Garlic Mixture",
        slug: "garlic-mixture",
        description: "Intensely aromatic South Indian savory mixture enriched with fried crushed garlic pods and dry red chillies.",
        variants: [
          { name: "Traditional Poondu (Garlic) Mixture", price200: 125, price500: 290, sku: "GM-ORIG", img: "/logos/mixture.png" },
          { name: "Roasted Cashew Garlic Mixture", price200: 160, price500: 380, sku: "GM-CASHEW", img: "/logos/mixture.png" },
          { name: "Extra Spicy Garlic Mixture", price200: 130, price500: 300, sku: "GM-SPICY", img: "/logos/mixture.png" },
          { name: "Pepper Garlic Sev Mixture", price200: 130, price500: 300, sku: "GM-PEPPER", img: "/logos/mixture.png" },
          { name: "Butter Garlic Ribbon Mixture", price200: 140, price500: 320, sku: "GM-BUTTER", img: "/logos/mixture.png" },
          { name: "Curry Leaves Garlic Delight", price200: 125, price500: 290, sku: "GM-CURRY", img: "/logos/mixture.png" },
          { name: "Kashmiri Mild Garlic Mixture", price200: 125, price500: 290, sku: "GM-MILD", img: "/logos/mixture.png" },
          { name: "Groundnut Garlic Crunch", price200: 120, price500: 280, sku: "GM-PEANUT", img: "/logos/mixture.png" },
          { name: "Millet Garlic Savory Mix", price200: 145, price500: 340, sku: "GM-MILLET", img: "/logos/mixture.png" },
        ],
      },
    ],
  },
  {
    name: "South Indian Sweets",
    slug: "south-indian-sweets",
    description: "Decadent pure ghee Mysore Pak, traditional Tirunelveli Halwa, Athirasam, and mouthwatering South Indian sweet treats.",
    products: [
      {
        name: "Traditional Laddu",
        slug: "traditional-laddu",
        description: "Hand-rolled golden spheres of sweet chickpea pearls blended with cardamom, cloves, cashews, and pure desi ghee.",
        variants: [
          { name: "Traditional Yellow Boondi Laddu", price200: 120, price500: 280, sku: "LD-BOONDI", img: "/logos/laddu.png" },
          { name: "Red Motichoor Laddu", price200: 140, price500: 320, sku: "LD-MOTICHOOR", img: "/logos/laddu.png" },
          { name: "Royal Pista Laddu", price200: 220, price500: 520, sku: "LD-PISTA", img: "/logos/laddu.png" },
          { name: "Dry Fruit & Nut Laddu", price200: 240, price500: 560, sku: "LD-DRYFRUIT", img: "/logos/laddu.png" },
          { name: "Besan Ghee Laddu", price200: 150, price500: 350, sku: "LD-BESAN", img: "/logos/laddu.png" },
          { name: "Gond Ke Laddu (Dink Laddu)", price200: 190, price500: 440, sku: "LD-GOND", img: "/logos/laddu.png" },
          { name: "Rava Ragi Laddu", price200: 135, price500: 310, sku: "LD-RAVA", img: "/logos/laddu.png" },
          { name: "Tirupati Style Big Srivari Laddu", price200: 160, price500: 370, sku: "LD-TIRUPATI", img: "/logos/laddu.png" },
          { name: "Ellu (Sesame Jaggery) Laddu", price200: 125, price500: 290, sku: "LD-ELLU", img: "/logos/laddu.png" },
        ],
      },
      {
        name: "Pure Ghee Mysore Pak",
        slug: "ghee-mysore-pak",
        description: "Legendary melt-in-mouth confection concocted from pure melted ghee, fragrant gram flour, and caramelized sugar syrup.",
        variants: [
          { name: "Soft Pure Ghee Mysore Pak", price200: 170, price500: 400, sku: "MP-SOFT", img: "/logos/palkova.png" },
          { name: "Traditional Porous Mysore Pak", price200: 160, price500: 370, sku: "MP-TRAD", img: "/logos/palkova.png" },
          { name: "Kaju Cashew Mysore Pak", price200: 210, price500: 490, sku: "MP-KAJU", img: "/logos/palkova.png" },
          { name: "Badam Almond Mysore Pak", price200: 210, price500: 490, sku: "MP-BADAM", img: "/logos/palkova.png" },
          { name: "Chocolate Ghee Mysore Pak", price200: 185, price500: 430, sku: "MP-CHOCO", img: "/logos/palkova.png" },
          { name: "Mango Infused Mysore Pak", price200: 180, price500: 420, sku: "MP-MANGO", img: "/logos/palkova.png" },
          { name: "Pistachio Royal Mysore Pak", price200: 230, price500: 540, sku: "MP-PISTA", img: "/logos/palkova.png" },
          { name: "Country Sugar (Nattu Sakkarai) Mysore Pak", price200: 195, price500: 450, sku: "MP-NATTU", img: "/logos/palkova.png" },
          { name: "Cardamom Velvet Mysore Pak", price200: 175, price500: 410, sku: "MP-VELVET", img: "/logos/palkova.png" },
        ],
      },
      {
        name: "Tirunelveli Wheat Halwa",
        slug: "tirunelveli-halwa",
        description: "The iconic Thamirabarani specialty made by fermenting samba wheat milk, cooked slow with pure cow ghee.",
        variants: [
          { name: "Original Tirunelveli Ghee Halwa", price200: 150, price500: 350, sku: "HW-ORIG", img: "/logos/jalebi.png" },
          { name: "Cashew Rich Wheat Halwa", price200: 190, price500: 440, sku: "HW-CASHEW", img: "/logos/jalebi.png" },
          { name: "Dry Fruit Special Halwa", price200: 220, price500: 510, sku: "HW-DRYFRUIT", img: "/logos/jalebi.png" },
          { name: "Karupatti (Palm Jaggery) Halwa", price200: 180, price500: 420, sku: "HW-KARUPATTI", img: "/logos/jalebi.png" },
          { name: "Badam Pista Halwa", price200: 215, price500: 500, sku: "HW-BADAM", img: "/logos/jalebi.png" },
          { name: "Muscoth Halwa (Coconut Milk Halwa)", price200: 170, price500: 390, sku: "HW-MUSCOTH", img: "/logos/jalebi.png" },
          { name: "Elachi Fragrant Halwa", price200: 155, price500: 360, sku: "HW-ELACHI", img: "/logos/jalebi.png" },
          { name: "Saffron Kesar Wheat Halwa", price200: 210, price500: 490, sku: "HW-KESAR", img: "/logos/jalebi.png" },
          { name: "Warm Ghee Halwa Pouch", price200: 160, price500: 370, sku: "HW-WARM", img: "/logos/jalebi.png" },
        ],
      },
    ],
  },
  {
    name: "Healthy & Millet Snacks",
    slug: "healthy-millet-snacks",
    description: "Nutrient-dense, low-GI ancient grain snacks crafted from Ragi, Kambu, Varagu, and wholesome roasted nuts.",
    products: [
      {
        name: "Ragi Murukku",
        slug: "ragi-murukku",
        description: "Finger millet crisps rich in calcium, iron, and fiber. Guilt-free traditional crunch.",
        variants: [
          { name: "Crispy Ragi Finger Millet Murukku", price200: 115, price500: 270, sku: "RMK-ORIG", img: "/logos/special_butter_murukku.png" },
          { name: "Spicy Garlic Ragi Murukku", price200: 125, price500: 290, sku: "RMK-GARLIC", img: "/logos/special_butter_murukku.png" },
          { name: "Sesame Butter Ragi Murukku", price200: 135, price500: 315, sku: "RMK-BUTTER", img: "/logos/special_butter_murukku.png" },
          { name: "Pepper Roasted Ragi Murukku", price200: 125, price500: 290, sku: "RMK-PEPPER", img: "/logos/special_butter_murukku.png" },
          { name: "Ajwain Digestive Ragi Murukku", price200: 120, price500: 280, sku: "RMK-AJWAIN", img: "/logos/special_butter_murukku.png" },
          { name: "Curry Leaf Crunchy Ragi Murukku", price200: 120, price500: 280, sku: "RMK-CURRY", img: "/logos/special_butter_murukku.png" },
          { name: "Fiery Andhra Ragi Murukku", price200: 130, price500: 300, sku: "RMK-ANDHRA", img: "/logos/special_butter_murukku.png" },
          { name: "Multi-Millet Super Murukku", price200: 140, price500: 325, sku: "RMK-SUPER", img: "/logos/special_butter_murukku.png" },
          { name: "Pure Ghee Ragi Murukku", price200: 155, price500: 360, sku: "RMK-GHEE", img: "/logos/special_butter_murukku.png" },
        ],
      },
      {
        name: "Roasted Masala Peanuts",
        slug: "roasted-masala-peanuts",
        description: "Crunchy double-roasted native peanuts coated in South Indian spices, garlic, and golden curry leaves.",
        variants: [
          { name: "South Indian Roasted Masala Peanuts", price200: 95, price500: 220, sku: "PNT-ORIG", img: "/logos/omapodi.png" },
          { name: "Poondu Garlic Roasted Peanuts", price200: 105, price500: 245, sku: "PNT-GARLIC", img: "/logos/omapodi.png" },
          { name: "Black Pepper Salted Peanuts", price200: 105, price500: 245, sku: "PNT-PEPPER", img: "/logos/omapodi.png" },
          { name: "Spicy Chilli Fry Peanuts", price200: 100, price500: 235, sku: "PNT-CHILLI", img: "/logos/omapodi.png" },
          { name: "Hing Hing Cumin Peanuts", price200: 100, price500: 235, sku: "PNT-HING", img: "/logos/omapodi.png" },
          { name: "Peri Peri Glazed Peanuts", price200: 110, price500: 255, sku: "PNT-PERI", img: "/logos/omapodi.png" },
          { name: "Chatpata Tangy Peanuts", price200: 105, price500: 245, sku: "PNT-TANGY", img: "/logos/omapodi.png" },
          { name: "Curry Leaf Fried Peanuts", price200: 105, price500: 245, sku: "PNT-CURRY", img: "/logos/omapodi.png" },
          { name: "Kashmiri Mild Roasted Peanuts", price200: 100, price500: 235, sku: "PNT-MILD", img: "/logos/omapodi.png" },
        ],
      },
      {
        name: "Kambu (Pearl Millet) Ribbon Pakoda",
        slug: "kambu-ribbon-pakoda",
        description: "Traditional crunchy ribbon sev made with wholesome pearl millet flour, seasoned with cumin and hing.",
        variants: [
          { name: "Classic Kambu Pearl Millet Pakoda", price200: 125, price500: 290, sku: "KMB-ORIG", img: "/logos/ribbon_pakoda.png" },
          { name: "Spicy Garlic Kambu Pakoda", price200: 135, price500: 310, sku: "KMB-GARLIC", img: "/logos/ribbon_pakoda.png" },
          { name: "Butter Kambu Ribbon Sev", price200: 145, price500: 335, sku: "KMB-BUTTER", img: "/logos/ribbon_pakoda.png" },
          { name: "Pepper Crisp Kambu Pakoda", price200: 135, price500: 310, sku: "KMB-PEPPER", img: "/logos/ribbon_pakoda.png" },
          { name: "Curry Leaf Roasted Kambu Pakoda", price200: 130, price500: 300, sku: "KMB-CURRY", img: "/logos/ribbon_pakoda.png" },
          { name: "Ajwain Carom Kambu Ribbon", price200: 130, price500: 300, sku: "KMB-AJWAIN", img: "/logos/ribbon_pakoda.png" },
          { name: "Andhra Hot Kambu Pakoda", price200: 140, price500: 320, sku: "KMB-HOT", img: "/logos/ribbon_pakoda.png" },
          { name: "Multi-Millet Medley Ribbon", price200: 150, price500: 350, sku: "KMB-MEDLEY", img: "/logos/ribbon_pakoda.png" },
          { name: "Pure Ghee Kambu Pakoda", price200: 165, price500: 380, sku: "KMB-GHEE", img: "/logos/ribbon_pakoda.png" },
        ],
      },
    ],
  },
];

async function main() {
  console.log("=========================================");
  console.log("1. CLEARING ENTIRE DATABASE FOR FRESH STORE");
  console.log("=========================================");

  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

  const tablesToClear = [
    "return_items",
    "return_requests",
    "shipments",
    "reviews",
    "review_images",
    "order_items",
    "order_addresses",
    "order_status_history",
    "payments",
    "payment_transactions",
    "orders",
    "cart_items",
    "carts",
    "wishlist_items",
    "inventories",
    "inventory_transactions",
    "variant_price_history",
    "variant_unit_prices",
    "product_variant_images",
    "product_variants",
    "product_images",
    "product_tag_maps",
    "combo_product_items",
    "offer_products",
    "products",
    "product_category_images",
    "product_categories",
    "produt_brand_images",
    "product_brands",
    "product_units",
    "customer_addresses",
  ];

  for (const table of tablesToClear) {
    try {
      if (table === "product_units") {
        await prisma.$executeRawUnsafe("UPDATE `product_units` SET `base_unit_id` = NULL;");
      }
      await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
      console.log(`✓ Cleared table: ${table}`);
    } catch (e: any) {
      console.warn(`! Warning on clearing ${table}: ${e.message}`);
    }
  }

  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
  console.log("Database cleared successfully.\n");

  console.log("=========================================");
  console.log("2. SEEDING ROLES & USERS");
  console.log("=========================================");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const customerPassword = await bcrypt.hash("customer123", 12);

  const getOrCreateRole = async (name: string, slug: string, description: string) => {
    let role = await prisma.role.findFirst({ where: { slug } });
    if (!role) {
      role = await prisma.role.create({
        data: { name, slug, description },
      });
    }
    return role;
  };

  const adminRole = await getOrCreateRole("ADMIN", "admin", "Administrator with full access");
  await getOrCreateRole("STAFF", "staff", "Staff member");
  const customerRole = await getOrCreateRole("CUSTOMER", "customer", "Regular customer");

  let adminUser = await prisma.user.findFirst({ where: { email: "admin@rithusnacks.com" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Admin",
        email: "admin@rithusnacks.com",
        password_hash: adminPassword,
        roleId: adminRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }

  let customerUser = await prisma.user.findFirst({ where: { email: "customer@example.com" } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "John Customer",
        email: "customer@example.com",
        password_hash: customerPassword,
        roleId: customerRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }
  console.log(`✓ Admin: admin@rithusnacks.com / admin123`);
  console.log(`✓ Customer: customer@example.com / customer123 (UUID: ${customerUser.uuid})\n`);

  console.log("=========================================");
  console.log("3. SEEDING ADDRESS, UNITS & BRAND");
  console.log("=========================================");

  await prisma.customerAddress.create({
    data: {
      uuid: crypto.randomUUID(),
      userId: customerUser.id,
      label: "Home",
      addressType: "shipping",
      full_name: "John Customer",
      phone: "9876543210",
      address_line1: "Flat 4B, Meenakshi Towers, 2nd Main Road",
      address_line2: "Anna Nagar East",
      landmark: "Opposite Tower Park",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600040",
      country: "India",
      isDefault: true,
      status: true,
      is_active: true,
    },
  });

  const gramUnit = await prisma.product_units.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Gram",
      code: "g",
      type: "weight",
      conversion_factor: 0.001,
      is_active: true,
      status: true,
    },
  });

  const brand = await prisma.productBrand.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Rithu's Snacks",
      slug: "rithus-snacks",
      description: "Authentic, handcrafted South Indian traditional snacks and sweets made with cold-pressed oils and pure desi ghee.",
      isActive: true,
      status: true,
    },
  });
  console.log(`✓ Default Address, Unit: Gram (g), Brand: Rithu's Snacks\n`);

  console.log("=========================================");
  console.log("4. SEEDING 6 CATEGORIES, 18 PRODUCTS, 162 VARIANTS");
  console.log("=========================================");

  let totalCategories = 0;
  let totalProducts = 0;
  let totalVariants = 0;
  let totalUnitPrices = 0;

  const createdProductsList: Array<{ id: bigint; uuid: string; name: string }> = [];

  for (const catData of CATEGORIES_DATA) {
    const category = await prisma.productCategory.create({
      data: {
        uuid: crypto.randomUUID(),
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        isActive: true,
        status: true,
      },
    });
    totalCategories++;
    console.log(`\n📂 [Category] ${catData.name} (${catData.slug})`);

    for (const prodData of catData.products) {
      const productUuid = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          uuid: productUuid,
          name: prodData.name,
          slug: prodData.slug,
          sku: `PRD-${prodData.slug.toUpperCase()}`,
          base_price: prodData.variants[0].price200,
          categoryId: category.id,
          brandId: brand.id,
          isActive: true,
          status: true,
        },
      });
      totalProducts++;
      createdProductsList.push({ id: product.id, uuid: product.uuid, name: product.name });
      console.log(`  📦 [Product] ${prodData.name}`);

      // Seed a primary product image
      await prisma.productImage.create({
        data: {
          productId: product.id,
          image_url: prodData.variants[0].img,
          isPrimary: true,
          sortOrder: 1,
          is_active: true,
        },
      });

      for (let vIdx = 0; vIdx < prodData.variants.length; vIdx++) {
        const vData = prodData.variants[vIdx];
        const variantUuid = crypto.randomUUID();
        const variantSku = `VAR-${vData.sku}-${vIdx + 1}`;
        const variantSlug = `${prodData.slug}-${vData.sku.toLowerCase()}`;
        const isDefault = vIdx === 0 ? 1 : 0;
        const isFeatured = vIdx < 3 ? 1 : 0;

        await prisma.$executeRawUnsafe(
          `INSERT INTO \`product_variants\` (
            \`uuid\`, \`product_id\`, \`variant_name\`, \`sku\`, \`slug\`, \`unit_value\`, \`unit_id\`,
            \`base_price\`, \`sale_price\`, \`is_default\`, \`is_active\`, \`out_of_stock\`,
            \`created_at\`, \`updated_at\`, \`short_description\`, \`description\`, \`is_featured\`
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, 1, 0,
            NOW(), NOW(), ?, ?, ?
          )`,
          variantUuid,
          product.id,
          vData.name,
          variantSku,
          variantSlug,
          200,
          gramUnit.id,
          vData.price200,
          vData.price200,
          isDefault,
          `Fresh & crunchy ${vData.name}.`,
          `${vData.name} freshly prepared in small batches using traditional South Indian recipes.`,
          isFeatured
        );

        const variant = await prisma.productVariant.findFirstOrThrow({
          where: { uuid: variantUuid },
        });
        totalVariants++;

        // Add variant image
        const imgUuid = crypto.randomUUID();
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`product_variant_images\` (
            \`uuid\`, \`variant_id\`, \`image_url\`, \`is_primary\`, \`sort_order\`, \`is_active\`, \`created_at\`, \`updated_at\`
          ) VALUES (?, ?, ?, 1, 1, 1, NOW(), NOW())`,
          imgUuid,
          variant.id,
          vData.img
        );

        // Add 200g Pack Unit Price
        const up200Uuid = crypto.randomUUID();
        const up200 = await prisma.variantUnitPrice.create({
          data: {
            uuid: up200Uuid,
            variant_id: variant.id,
            unit_id: gramUnit.id,
            unit_value: 200,
            sku: `${vData.sku}-200G`,
            base_price: vData.price200,
            is_default: true,
            isActive: true,
          },
        });
        totalUnitPrices++;

        // Inventory for 200g
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`inventories\` (
            \`variant_id\`, \`variant_unit_price_id\`, \`quantity_available\`, \`quantity_reserved\`, \`reorder_level\`, \`is_active\`, \`created_at\`, \`updated_at\`
          ) VALUES (?, ?, 150, 0, 20, 1, NOW(), NOW())
          ON DUPLICATE KEY UPDATE \`quantity_available\` = 150, \`is_active\` = 1`,
          variant.id,
          up200.id
        );

        // Add 500g Pack Unit Price
        const up500Uuid = crypto.randomUUID();
        const up500 = await prisma.variantUnitPrice.create({
          data: {
            uuid: up500Uuid,
            variant_id: variant.id,
            unit_id: gramUnit.id,
            unit_value: 500,
            sku: `${vData.sku}-500G`,
            base_price: vData.price500,
            is_default: false,
            isActive: true,
          },
        });
        totalUnitPrices++;

        // Inventory for 500g
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`inventories\` (
            \`variant_id\`, \`variant_unit_price_id\`, \`quantity_available\`, \`quantity_reserved\`, \`reorder_level\`, \`is_active\`, \`created_at\`, \`updated_at\`
          ) VALUES (?, ?, 100, 0, 15, 1, NOW(), NOW())
          ON DUPLICATE KEY UPDATE \`quantity_available\` = 100, \`is_active\` = 1`,
          variant.id,
          up500.id
        );
      }
    }
  }

  console.log("\n=========================================");
  console.log("5. SEEDING SAMPLE VERIFIED REVIEWS");
  console.log("=========================================");

  const reviewComments = [
    { title: "Crispy and authentic!", comment: "Takes me right back to our village festival in Tamil Nadu. Perfectly balanced spices and zero oily aftertaste.", rating: 5, name: "Suresh Ramanathan", city: "Chennai" },
    { title: "Exceptional quality!", comment: "The aroma when opening the pack is heavenly. Fresh, fragrant with curry leaves, and crunchy in every bite.", rating: 5, name: "Meenakshi Sundaram", city: "Madurai" },
    { title: "Loved by the whole family", comment: "Ordered for Diwali and everyone from grandma to the kids praised the crispness. Re-ordering immediately.", rating: 5, name: "Karthik Subramanian", city: "Bengaluru" },
    { title: "Best tea-time companion", comment: "Unbeatable crunch and freshly made taste. Pair this with hot filter coffee and your evening is set.", rating: 5, name: "Ananya Narayanan", city: "Coimbatore" },
    { title: "Top-notch packaging", comment: "Delivered securely in heavy-duty food-grade pouches. Zero breakage during transit.", rating: 5, name: "Dr. Arvind Swaminathan", city: "Trichy" },
  ];

  for (let i = 0; i < Math.min(6, createdProductsList.length); i++) {
    const prod = createdProductsList[i];
    const defaultVariant = await prisma.productVariant.findFirst({
      where: { productId: prod.id },
      include: { variant_unit_prices: true },
    });

    const upId = defaultVariant?.variant_unit_prices[0]?.id;

    for (let rIdx = 0; rIdx < reviewComments.length; rIdx++) {
      const rc = reviewComments[rIdx];
      await prisma.review.create({
        data: {
          uuid: crypto.randomUUID(),
          productId: prod.id,
          variant_unit_price_id: upId,
          userId: customerUser.id,
          rating: rc.rating,
          title: rc.title,
          comment: rc.comment,
          isApproved: true,
          is_active: true,
        },
      });
    }
  }
  console.log(`✓ Seeded 30 glowing customer reviews across top products`);

  console.log("\n=========================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=========================================");
  console.log(`📁 Categories:        ${totalCategories}`);
  console.log(`📦 Products:          ${totalProducts}`);
  console.log(`🏷️ Variants:          ${totalVariants}`);
  console.log(`💰 Unit Prices:       ${totalUnitPrices}`);
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
