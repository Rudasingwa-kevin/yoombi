const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Homepage Sections...');
  
  await prisma.homepageSection.createMany({
    data: [
      {
        title: 'Top Rated',
        subtitle: 'Highest rated this month',
        type: 'DYNAMIC',
        criteria: 'TOP_RATED',
        order: 0,
        active: true
      },
      {
        title: 'New Comers',
        subtitle: 'Freshly joined the platform',
        type: 'DYNAMIC',
        criteria: 'NEW_COMERS',
        order: 1,
        active: true
      },
      {
        title: 'Luxury Dining',
        subtitle: 'Fine dining experiences',
        type: 'DYNAMIC',
        criteria: 'EXCLUSIVE',
        order: 2,
        active: true
      }
    ],
    skipDuplicates: true
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
