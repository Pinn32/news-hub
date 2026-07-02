// scripts/keep-alive-mongo.mjs
// Keeps the MongoDB Atlas free (M0) cluster alive by opening a real connection.
// Atlas auto-pauses idle clusters; any connection resets the inactivity timer.
// SECURITY: never log MONGODB_URI — it embeds credentials.

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

try {
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 15000,
  });
  const res = await mongoose.connection.db.admin().ping(); // -> { ok: 1 }
  console.log("MongoDB ping ok:", JSON.stringify(res));
} catch (err) {
  // Log only the error type/code — err.message can contain the host/URI.
  console.error(
    `MongoDB keep-alive failed: ${err?.name ?? "Error"}` +
      (err?.code ? ` (code ${err.code})` : "")
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
