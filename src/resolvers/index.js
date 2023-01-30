const path = require("path");
const fsPromises = require("fs/promises");
const { fileExists, readJsonFile } = require("../utils/fileHandling");
const { GraphQLError } = require("graphql");
const crypto = require("node:crypto");

exports.resolvers = {
  Query: {
    //Hämtar varukorg med ID
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
  Mutation: {
    createCart: async (_, args) => {
      const newCart = {
        id: crypto.randomUUID(),
        totalAmount: args.totalAmount,
      };

      let filePath = path.join(__dirname, `../data/projects/${newCart.id}.json`);

      let idExists = true;

      while(idExists) {
        const exists = await fileExists(filePath)
        console.log(exists, newCart.id)
        idExists = exists

        if(exists) {
          newCart.id = crypto.randomUUID()
          filePath = path.join(__dirname, `../data/projects/${newCart.id}.json`)
        }

        idExists = exists

        await fsPromises.writeFile(filePath, JSON.stringify(newCart));

        return newCart
      }
    },
  },
};
