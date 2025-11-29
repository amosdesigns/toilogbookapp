import { defineConfig } from '@prisma/cli/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!
  }
})
