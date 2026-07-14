import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined;
  isMock: boolean | undefined;
};

// Configure WebSocket constructor for Neon serverless pool transactions in Node.js server environment
if (typeof window === "undefined") {
  const ws = require("ws");
  const { neonConfig } = require("@neondatabase/serverless");
  neonConfig.webSocketConstructor = ws;
}

const initPrisma = () => {
  const connectionString = process.env.DATABASE_URL;
  console.log("DEBUG initPrisma connectionString =", connectionString);
  
  if (!connectionString) {
    globalForPrisma.isMock = true;
    return new PrismaClient({
      adapter: {
        modelNameMap: {},
        provider: "postgres",
        query: async () => ({ rows: [] }),
        execute: async () => 0,
        transaction: async (options: any, callback: any) => callback({
          query: async () => ({ rows: [] }),
          execute: async () => 0,
        }),
      } as any
    });
  }
  
  globalForPrisma.isMock = false;
  
  // Setup Neon database connection pool
  const pool = new Pool({ connectionString });
  
  // Instantiate the Neon driver adapter for Prisma 7 compatibility
  const adapter = new PrismaNeon(pool as any);
  
  return new PrismaClient({ adapter });
};

// Re-initialize if there is no cached client, or if the cached client is a mock
// but we now have a valid DATABASE_URL environment variable loaded at runtime.
if (!globalForPrisma.prisma || (globalForPrisma.isMock && process.env.DATABASE_URL)) {
  globalForPrisma.prisma = initPrisma();
}

export const prisma = globalForPrisma.prisma;
