import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function test() {
    try {
        const restaurants = await prisma.restaurant.findMany({
            where: {},
            include: {
                _count: {
                    select: { followers: true, reviews: true }
                }
            },
            orderBy: { rating: 'desc' }
        });
        console.log("Success", restaurants.length);
    } catch (e: any) {
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
        console.error("Error code:", e.code);
    } finally {
        await prisma.$disconnect();
    }
}
test();
