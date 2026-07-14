import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined;
  isMock: boolean | undefined;
  connectionStringUsed: string | undefined;
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
    });
  }
  
  globalForPrisma.isMock = false;
  
  // Setup Neon database connection pool using parsed connection options
  // to avoid standard pg-connection-string bundler parser failures in Turbopack.
  let poolOptions: any = {};
  try {
    const parsed = new URL(connectionString);
    poolOptions = {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.substring(1)),
      ssl: true,
    };
  } catch (err) {
    console.error("Failed to parse connectionString, falling back to string pass:", err);
    poolOptions = { connectionString };
  }

  const pool = new Pool(poolOptions);
  
  // Instantiate the Neon driver adapter for Prisma 7 compatibility
  const adapter = new PrismaNeon(pool as any);
  
  return new PrismaClient({ adapter });
};

// Re-initialize if there is no cached client, or if the cached connection string has changed.
const currentConnectionString = getEnvConnectionString();
if (!globalForPrisma.prisma || globalForPrisma.connectionStringUsed !== currentConnectionString) {
  globalForPrisma.prisma = initPrisma(currentConnectionString);
  globalForPrisma.connectionStringUsed = currentConnectionString;
}

export const prisma = globalForPrisma.prisma;
