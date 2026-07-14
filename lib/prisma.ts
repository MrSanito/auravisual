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

const getEnvConnectionString = () => {
  const str = 
    process.env.DATABASE_URL || 
    process.env.DATABASEURL || 
    process.env.POSTGRES_URL || 
    "";
    
  const isInvalid = 
    !str || 
    str === "undefined" || 
    str === "null" || 
    !str.trim();
    
  return isInvalid ? "" : str;
};

const initPrisma = (connectionString: string) => {
  console.log("DEBUG initPrisma connectionStringLength =", connectionString.length);
  
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
    } as any);
  }
  
  globalForPrisma.isMock = false;
  
  // Setup Neon database connection pool
  const pool = new Pool({ connectionString });
  
  // Instantiate the Neon driver adapter for Prisma 7 compatibility
  const adapter = new PrismaNeon(pool as any);
  
  return new PrismaClient({ adapter } as any);
};

// Export a Proxy that lazily initializes the Prisma Client on first database access
// at runtime, avoiding any pre-evaluation/instantiation during the Next.js build phase.
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = initPrisma(getEnvConnectionString());
    }
    return Reflect.get(globalForPrisma.prisma, prop, receiver);
  }
});
