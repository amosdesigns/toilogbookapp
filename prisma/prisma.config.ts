import { defineConfig } from '@prisma/cli/config'

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!
    }
  }
})
