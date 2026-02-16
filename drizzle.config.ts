const drizzleConfig = {
  schema: "./src/core/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
};

export default drizzleConfig;
