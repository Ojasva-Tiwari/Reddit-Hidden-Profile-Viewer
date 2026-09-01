import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import * as dotenv from "dotenv";

dotenv.config();

export async function runMigrations() {
  console.log("Running pending database migrations from ./drizzle...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✓ Database migrations completed successfully.");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    throw error;
  }
}

// Allow direct CLI execution
if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
