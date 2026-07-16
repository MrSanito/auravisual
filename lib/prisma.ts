import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined;
  isMock: boolean | undefined;
};

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
  
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 20000,
    max: 10,
  });
  
  const adapter = new PrismaPg(pool);
  
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
