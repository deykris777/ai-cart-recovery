import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/carts";
import fs from "fs";
import path from "path";

export * from "./schema/carts";

const connectionString = process.env.DATABASE_URL;

// Path to local mock db file
const MOCK_DB_PATH = path.resolve(__dirname, "../../../scratch/mock_db.json");

// Helper to ensure parent dir exists and read/write JSON data
function getMockData(): any[] {
  try {
    const dir = path.dirname(MOCK_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(MOCK_DB_PATH)) {
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify([]));
      return [];
    }
    const raw = fs.readFileSync(MOCK_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading mock DB:", err);
    return [];
  }
}

function saveMockData(data: any[]) {
  try {
    const dir = path.dirname(MOCK_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to mock DB:", err);
  }
}

// Mock Drizzle Client Implementation
class MockDbClient {
  select() {
    return {
      from: (table: any) => {
        const data = getMockData().map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));

        return {
          orderBy: (orderFn: any) => {
            // Sort by createdAt descending
            return data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          },
          then: (resolve: any) => resolve(data),
          catch: (reject: any) => {},
        };
      },
      then: (resolve: any) => {
        const data = getMockData().map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));
        resolve(data);
      },
    };
  }

  insert(table: any) {
    return {
      values: (values: any | any[]) => {
        const itemsToInsert = Array.isArray(values) ? values : [values];
        const data = getMockData();
        const insertedItems = itemsToInsert.map(item => {
          const newItem = {
            id: item.id || crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
            email: item.email,
            cartValue: item.cartValue,
            productName: item.productName,
            customerTier: item.customerTier,
            frictionPoint: item.frictionPoint,
            strategy: item.strategy,
            status: item.status,
            confidenceScore: item.confidenceScore,
            agentLog: item.agentLog,
            emailCopy: item.emailCopy,
            createdAt: item.createdAt || new Date(),
            updatedAt: item.updatedAt || new Date(),
          };
          data.push(newItem);
          return newItem;
        });

        saveMockData(data);

        return {
          returning: () => {
            return {
              then: (resolve: any) => resolve(insertedItems),
            };
          },
          then: (resolve: any) => resolve(insertedItems),
        };
      },
    };
  }

  delete(table: any) {
    return {
      then: (resolve: any) => {
        saveMockData([]);
        resolve();
      },
    };
  }
}

let dbInstance: any;

if (connectionString) {
  console.log("DATABASE_URL found. Initializing PostgreSQL pool with Drizzle ORM...");
  const pool = new Pool({
    connectionString,
  });
  dbInstance = drizzle(pool, { schema });
} else {
  console.log(`DATABASE_URL not found. Initializing JSON-file Mock DB at: ${MOCK_DB_PATH}`);
  dbInstance = new MockDbClient();
}

export const db = dbInstance;
export const isMock = !connectionString;
export { MOCK_DB_PATH };
