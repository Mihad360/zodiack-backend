import { createClient } from "redis";

export const connectRedis = async () => {
  const client = createClient();
  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect();
  console.log("Connected to Redis");

  await client.set("name", "Mihad");
  const value = await client.get("name");
  console.log(value);
};
