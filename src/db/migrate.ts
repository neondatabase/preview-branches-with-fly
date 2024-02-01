import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: "require",
});

const db = drizzle(sql);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    await sql.end();

    console.log("Migration successful");
  } catch (error) {
    console.error(error);
    await sql.end();
    process.exit(1);
  }
};

main();
