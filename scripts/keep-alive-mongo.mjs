// scripts/keep-alive-mongo.mjs
// Keeps the MongoDB Atlas free (M0) cluster alive with a REAL write.
// An admin ping does not reliably count as cluster activity; an actual
// upsert on a collection is genuine CRUD activity that resets the timer.
// SECURITY: never log MONGODB_URI — it embeds credentials.

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

try {
  await client.connect();
  // client.db() uses the database named in the connection string.
  const res = await client
    .db()
    .collection("keep_alive")
    .updateOne(
      { _id: "keep-alive" },
      { $set: { lastPingAt: new Date() } },
      { upsert: true }
    );
  console.log(
    `MongoDB keep-alive write ok (matched=${res.matchedCount}, ` +
      `modified=${res.modifiedCount}, upserted=${res.upsertedCount})`
  );
} catch (err) {
  // Log only the error type/code — err.message can contain the host/URI.
  console.error(
    `MongoDB keep-alive failed: ${err?.name ?? "Error"}` +
      (err?.code ? ` (code ${err.code})` : "")
  );
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
}
