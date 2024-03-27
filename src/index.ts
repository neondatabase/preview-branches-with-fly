import "dotenv/config";
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

const fastify = Fastify();

fastify.get("/", async function handler(_, reply) {
  try {
    const allUsers = await db.select().from(users);
    return { users: allUsers };
  } catch (error) {
    console.log(error);
    return reply.status(500).send({ error: `"Something went wrong":${error}` });
  }
});

const startServer = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${PORT} 🚀`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();
