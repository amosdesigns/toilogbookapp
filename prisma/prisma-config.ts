// Prisma 7 configuration
export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL!
    }
  }
}
