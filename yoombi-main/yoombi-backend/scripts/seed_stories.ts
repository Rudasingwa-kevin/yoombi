import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedStories() {
    try {
        console.log('--- Seeding Real Stories ---');
        
        const restaurants = await prisma.restaurant.findMany({ take: 3 });
        if (restaurants.length === 0) {
            console.log('No restaurants found. Please seed restaurants first.');
            return;
        }

        const storyData = [
            {
                restaurant: restaurants[0],
                items: [
                    { type: 'IMAGE', url: 'https://images.unsplash.com/photo-1517248135467-4c7ed9d421bb', text: 'Our new garden seating is open!' },
                    { type: 'TEXT', text: 'Happy Hour: 2-for-1 cocktails starting at 5 PM! 🍸' }
                ]
            },
            {
                restaurant: restaurants[1],
                items: [
                    { type: 'TEXT', text: 'New Chef Special: Truffle Pasta 🍝' },
                    { type: 'IMAGE', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de', text: 'Freshly baked every morning.' }
                ]
            }
        ];

        for (const data of storyData) {
            if (!data.restaurant) continue;

            const existingStory = await prisma.story.findFirst({
                where: { restaurantId: data.restaurant.id }
            });

            if (existingStory) {
                // Add items to existing
                await prisma.storyItem.createMany({
                    data: data.items.map(item => ({
                        storyId: existingStory.id,
                        type: item.type,
                        url: item.url,
                        text: item.text,
                    }))
                });
            } else {
                // Create new story
                await prisma.story.create({
                    data: {
                        restaurantId: data.restaurant.id,
                        items: {
                            create: data.items
                        }
                    }
                });
            }
            console.log(`✅ Seeded stories for: ${data.restaurant.name}`);
        }

        console.log('--- Seeding Complete ---');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedStories();
