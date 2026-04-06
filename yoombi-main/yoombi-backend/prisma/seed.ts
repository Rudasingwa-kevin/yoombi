import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');
  
  // 0. Clear existing data to prevent duplicates (idempotency)
  console.log('Clearing old data...');
  await prisma.visit.deleteMany();
  await prisma.review.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users (Admin, Owner, Customer)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yoombi.rw' },
    update: {},
    create: {
      email: 'admin@yoombi.rw',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    },
  });

  const owners = await Promise.all([
    prisma.user.upsert({
      where: { email: 'heaven@yoombi.rw' },
      update: {},
      create: { email: 'heaven@yoombi.rw', password: hashedPassword, name: 'Heaven Owner', role: 'OWNER', isApproved: true }
    }),
    prisma.user.upsert({
      where: { email: 'repub@yoombi.rw' },
      update: {},
      create: { email: 'repub@yoombi.rw', password: hashedPassword, name: 'Repub Owner', role: 'OWNER', isApproved: true }
    }),
    prisma.user.upsert({
      where: { email: 'soy@yoombi.rw' },
      update: {},
      create: { email: 'soy@yoombi.rw', password: hashedPassword, name: 'Soy Owner', role: 'OWNER', isApproved: true }
    }),
    prisma.user.upsert({
      where: { email: 'inka@yoombi.rw' },
      update: {},
      create: { email: 'inka@yoombi.rw', password: hashedPassword, name: 'Inka Owner', role: 'OWNER', isApproved: true }
    })
  ]);

  const customer = await prisma.user.upsert({
    where: { email: 'user@yoombi.rw' },
    update: {},
    create: {
      email: 'user@yoombi.rw',
      password: hashedPassword,
      name: 'Happy Customer',
      role: 'USER',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    },
  });

  // 2. Create Restaurants
  const restaurants = [
    {
      name: 'The Heaven Restaurant',
      description: 'Experience the finest luxury dining in the heart of Kigali with breathtaking views and organic Rwandan flavors.',
      cuisine: 'Modern African / International',
      area: 'Kiyovu',
      city: 'Kigali',
      phone: '+250 780 000 000',
      email: 'info@heaven.rw',
      isApproved: true,
      isTrending: true,
      images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
      rating: 4.8,
      ownerId: owners[0].id,
    },
    {
      name: 'Repub Lounge',
      description: 'Famous for its authentic Rwandan cuisine and vibrant atmosphere. A true taste of Kigali luxury.',
      cuisine: 'Rwandan / Grill',
      area: 'Kimihurura',
      city: 'Kigali',
      phone: '+250 788 123 456',
      email: 'contact@republounge.rw',
      isApproved: true,
      images: ['https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800'],
      rating: 4.7,
      ownerId: owners[1].id,
    },
    {
      name: 'Soy Asian Table',
      description: 'The premier destination for Asian fusion in Rwanda. Sophisticated flavors in a sleek, modern setting.',
      cuisine: 'Asian Fusion',
      area: 'Kiyovu',
      city: 'Kigali',
      phone: '+250 785 987 654',
      email: 'hello@soy.rw',
      isApproved: true,
      isTrending: true,
      images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800'],
      rating: 4.9,
      ownerId: owners[2].id,
    },
    {
        name: 'Inka Steakhouse',
        description: 'Premium cuts of meat grilled to perfection. The ultimate destination for steak lovers in Kigali.',
        cuisine: 'Steakhouse',
        area: 'Kimihurura',
        city: 'Kigali',
        phone: '+250 789 555 333',
        email: 'info@inka.rw',
        isApproved: true,
        images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
        rating: 4.6,
        ownerId: owners[3].id,
    }
  ];

  for (const rData of restaurants) {
    const restaurant = await prisma.restaurant.create({ data: rData });
    
    // Create Menu Items for each
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Signature Dish',
                description: 'Our most popular creation.',
                priceRaw: 12000,
                category: 'Main Course',
                restaurantId: restaurant.id,
            },
            {
                name: 'House Special',
                description: 'Chefs recommendation.',
                priceRaw: 15000,
                category: 'Main Course',
                restaurantId: restaurant.id,
            }
        ]
    });

    // Create a Review for each
    await prisma.review.create({
      data: {
        rating: 5,
        text: 'Best dining experience in the city!',
        userId: customer.id,
        restaurantId: restaurant.id,
      },
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
