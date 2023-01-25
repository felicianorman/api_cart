const path = require("path");
const fsPromises = require("fs/promises");
const { fileExists, readJsonFile } = require("../utils/fileHandling");
const { GraphQLError } = require("graphql");
const crypto = require("node:crypto");

exports.resolvers = {
  Query: {
    getCartById: async (_, args) => {
      const cartId = args.cartId;

      const cartFilePath = path.join(
        __dirname,
        `../data/projects/${cartId}.json`
      );

      const cartExists = await fileExists(cartFilePath);
      if (!cartExists) return new GraphQLError("That project does not exist");

      const cartData = await fsPromises.readFile(cartFilePath, {
        encoding: "utf-8",
      });
      const data = JSON.parse(cartData);
      return data;
    },
  },
};
