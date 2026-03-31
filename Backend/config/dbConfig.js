const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const cleanupLegacyTruckData = async () => {
    // Legacy rows may exist from older schemas where lineItemId was not enforced.
    // These rows break Prisma reads once lineItemId becomes non-nullable.
    let totalRemoved = 0;

    while (true) {
        const malformedResult = await prisma.$runCommandRaw({
            find: 'truck_allocations',
            filter: {
                $or: [
                    { lineItemId: null },
                    { lineItemId: { $exists: false } },
                ],
            },
            projection: { _id: 1 },
            limit: 2000,
        });

        const malformedRows = malformedResult?.cursor?.firstBatch || [];
        if (malformedRows.length === 0) {
            break;
        }

        const malformedIds = malformedRows.map((row) => row._id);

        await prisma.$runCommandRaw({
            delete: 'truck_delivered_items',
            deletes: [
                {
                    q: { truckAllocationId: { $in: malformedIds } },
                    limit: 0,
                },
            ],
        });

        await prisma.$runCommandRaw({
            delete: 'truck_allocations',
            deletes: [
                {
                    q: { _id: { $in: malformedIds } },
                    limit: 0,
                },
            ],
        });

        totalRemoved += malformedIds.length;
    }

    return totalRemoved;
};

const connectDb = async () => {
    try {
        await prisma.$connect();
        const removed = await cleanupLegacyTruckData();
        if (removed > 0) {
            console.warn(`Removed ${removed} legacy malformed truck allocations during startup cleanup`);
        }
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

module.exports = { prisma, connectDb, cleanupLegacyTruckData };
