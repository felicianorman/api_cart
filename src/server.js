require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const { resolvers } = require("./resolvers/index");
const { loadFiles } = require("@graphql-tools/load-files");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const path = require("path");
// const { startStandaloneServer } = require("@apollo/server/standalone");
const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "data")));

const port = process.env.PORT || 5000;

async function run() {
  try {
    const typeDefs = await loadFiles(path.join(__dirname, "schema.graphql"));

    const schema = makeExecutableSchema({
      typeDefs: typeDefs,
      resolvers: resolvers,
    });

    const server = new ApolloServer({ schema: schema });

    await server.start();

    app.use("/graphql", expressMiddleware(server));

    app.listen(port, () => {
      console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
    });
  } catch (error) {
    console.error(error);
  }
}

run();