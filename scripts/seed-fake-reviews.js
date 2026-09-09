const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../src/generated/prisma/client.js'));
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const crypto = require('crypto');
require('dotenv').config();

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: url.hostname === 'localhost' ? '127.0.0.1' : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });

  const prisma = new PrismaClient({ adapter });

  console.log('Connecting to database...');

  // Customers to create/ensure
  const customers = [
    { name: 'Suresh V.', email: 'suresh.v@example.com', city: 'Chennai' },
    { name: 'Ananya Ramesh', email: 'ananya.ramesh@example.com', city: 'Coimbatore' },
    { name: 'Murali Krishnan', email: 'murali.krishnan@example.com', city: 'Mumbai' },
    { name: 'Meenakshi Sundaram', email: 'meenakshi.s@example.com', city: 'Madurai' },
    { name: 'Kavitha Balaji', email: 'kavitha.b@example.com', city: 'Bangalore' },
    { name: 'Siddharth Rao', email: 'siddharth.r@example.com', city: 'Hyderabad' },
  ];

  const userMap = new Map();

  for (const c of customers) {
    let user = await prisma.user.findFirst({
      where: { email: c.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          uuid: crypto.randomUUID(),
          name: c.name,
          email: c.email,
          roleId: 3n, // CUSTOMER
          status: 'active',
          is_active: true,
        },
      });
      console.log(`Created user: ${c.name} (${user.id})`);
    } else {
      console.log(`Found existing user: ${c.name} (${user.id})`);
    }

    userMap.set(c.name, { user, city: c.city });
  }

  // Reviews to insert for Kai Murukku (Handcrafted) - UUID: 1edacdc7-2de8-4696-919c-f6123d0214e7 (Product ID 11)
  const product11 = await prisma.product.findFirst({
    where: { uuid: '1edacdc7-2de8-4696-919c-f6123d0214e7' },
    include: { variants: { include: { variant_unit_prices: true } } },
  });

  if (!product11) {
    console.error('Product 11 not found!');
    process.exit(1);
  }

  const unitPriceId = product11.variants[0]?.variant_unit_prices[0]?.id || null;

  const reviewsForKaiMurukku = [
    {
      reviewer: 'Suresh V.',
      rating: 5,
      title: 'Chennai',
      comment:
        'The aroma of pure ghee hits you the moment you open the box. The boondi pearls are so tender and perfectly sweetened with just the right touch of cardamom. Sent this to my parents in Bangalore and they loved it!',
      dateOffsetDays: 3,
    },
    {
      reviewer: 'Ananya Ramesh',
      rating: 5,
      title: 'Coimbatore',
      comment:
        'Ordered 15 boxes for Diwali corporate gifting. Packaged so meticulously, not even a single laddu was damaged. The taste reminds me of temple prasadam laddu with aromatic edible camphor. Exceptional quality!',
      dateOffsetDays: 7,
    },
    {
      reviewer: 'Murali Krishnan',
      rating: 5,
      title: 'Mumbai',
      comment:
        'Very fast delivery to Mumbai in 3 days. Texture is juicy yet firm enough to hold shape. Authentic Namakkal style laddu. Will definitely order the 1 kg pack next time!',
      dateOffsetDays: 12,
    },
    {
      reviewer: 'Meenakshi Sundaram',
      rating: 5,
      title: 'Madurai',
      comment:
        'Authentic handmade Kai Murukku just like my grandmother used to twist in the village kitchen. Golden, crisp, not oily at all, and packed with real cumin flavour. Irresistible crunch!',
      dateOffsetDays: 16,
    },
    {
      reviewer: 'Kavitha Balaji',
      rating: 5,
      title: 'Bangalore',
      comment:
        'Freshness is outstanding. None of the pieces were broken during transit. You can immediately taste the quality of ground rice and pure butter used in the dough. Highly recommended!',
      dateOffsetDays: 21,
    },
  ];

  for (const rev of reviewsForKaiMurukku) {
    const cust = userMap.get(rev.reviewer);
    if (!cust) continue;

    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: {
        productId: product11.id,
        userId: cust.user.id,
      },
    });

    const createdAt = new Date(Date.now() - rev.dateOffsetDays * 24 * 60 * 60 * 1000);

    if (!existing) {
      await prisma.review.create({
        data: {
          uuid: crypto.randomUUID(),
          productId: product11.id,
          variant_unit_price_id: unitPriceId,
          userId: cust.user.id,
          rating: rev.rating,
          title: rev.title,
          comment: rev.comment,
          isApproved: true,
          is_active: true,
          createdAt,
          updatedAt: createdAt,
        },
      });
      console.log(`Created review for Kai Murukku by ${rev.reviewer} (${rev.title})`);
    } else {
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: rev.rating,
          title: rev.title,
          comment: rev.comment,
          isApproved: true,
          is_active: true,
        },
      });
      console.log(`Updated existing review for Kai Murukku by ${rev.reviewer}`);
    }
  }

  // Also seed a couple reviews for other popular products
  const otherProducts = await prisma.product.findMany({
    where: {
      id: { in: [12n, 14n, 15n, 19n, 22n, 24n] },
    },
    include: { variants: { include: { variant_unit_prices: true } } },
  });

  for (const prod of otherProducts) {
    const cust1 = userMap.get('Suresh V.');
    const cust2 = userMap.get('Ananya Ramesh');
    const uId = prod.variants[0]?.variant_unit_prices[0]?.id || null;

    if (cust1) {
      const exists = await prisma.review.findFirst({
        where: { productId: prod.id, userId: cust1.user.id },
      });
      if (!exists) {
        await prisma.review.create({
          data: {
            uuid: crypto.randomUUID(),
            productId: prod.id,
            variant_unit_price_id: uId,
            userId: cust1.user.id,
            rating: 5,
            title: 'Chennai',
            comment: `Outstanding taste and traditional flavor in this ${prod.name}! Very crispy and aromatic.`,
            isApproved: true,
            is_active: true,
          },
        });
      }
    }

    if (cust2) {
      const exists = await prisma.review.findFirst({
        where: { productId: prod.id, userId: cust2.user.id },
      });
      if (!exists) {
        await prisma.review.create({
          data: {
            uuid: crypto.randomUUID(),
            productId: prod.id,
            variant_unit_price_id: uId,
            userId: cust2.user.id,
            rating: 5,
            title: 'Coimbatore',
            comment: `Fresh and authentic! Everyone at home loved the quality. Will reorder soon!`,
            isApproved: true,
            is_active: true,
          },
        });
      }
    }
  }

  console.log('Finished seeding reviews!');
  await prisma.$disconnect();
}

main().catch(console.error);
