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
        `../data/projects/carts/${cartId}.json`
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

      let filePath = path.join(
        __dirname,
        `../data/projects/carts/${newCart.id}.json`
      );

      let idExists = true;

      while (idExists) {
        const exists = await fileExists(filePath);
        console.log(exists, newCart.id);
        idExists = exists;

        if (exists) {
          newCart.id = crypto.randomUUID();
          filePath = path.join(
            __dirname,
            `../data/projects/carts/${newCart.id}.json`
          );
        }

        idExists = exists;

        await fsPromises.writeFile(filePath, JSON.stringify(newCart));

        return newCart;
      }
    },
    createProduct: async (_, args) => {
      const { productName, price } = args.input;

      const newProduct = {
        productId: crypto.randomUUID(),
        productName,
        price,
      };

      let filePath = path.join(
        __dirname,
        `../data/projects/products/${newProduct.productId}.json`
      );

      let idExists = true;

      while (idExists) {
        const exists = await fileExists(filePath);
        console.log(exists, newProduct.productId);
        idExists = exists;

        if (exists) {
          newProduct.productId = crypto.randomUUID();
          filePath = path.join(
            __dirname,
            `../data/projects/products/${newProduct.productId}.json`
          );
        }

        idExists = exists;

        await fsPromises.writeFile(filePath, JSON.stringify(newProduct));

        return newProduct;
      }
    },
    deleteCart: async (_, args) => {
      const cartId = args.cartId;

      let filePath = path.join(
        __dirname,
        `../data/projects/carts/${cartId}.json`
      );

      const cartExists = await fileExists(filePath);
      if (!cartExists) return new GraphQLError("That cart does not exist!");

      await fsPromises.unlink(filePath);

      return {
        deletedId: cartId,
        success: true,
      };
    },
    addToCart: async (_, args) => {
      const { cartId, productId } = args;

      //cart filväg
      const cartPath = path.join(
        __dirname,
        `../data/projects/carts/${cartId}.json`
      );
      const cartExists = await fileExists(cartPath);

      if (!cartExists) {
        return new GraphQLError("This cart does not exist");
      }

      //produkt filväg
      const productPath = path.join(
        __dirname,
        `../data/projects/products/${productId}.json`
      );
      const productExist = await fileExists(productPath);

      if (!productExist) {
        return new GraphQLError("This product does not exist");
      }

      //läser filerna
      const cartFile = await fsPromises.readFile(cartPath, {
        encoding: "utf-8",
      });

      //parsar cart
      let shoppingCart = JSON.parse(cartFile);

      const newProduct = await fsPromises.readFile(productPath, {
        encoding: "utf-8",
      });

      const productToCart = JSON.parse(newProduct);

      if (shoppingCart.products == undefined) {
        shoppingCart.products = [];
        shoppingCart.products.push(productToCart);
      } else {
        shoppingCart.products.push(productToCart);
      }

      let products = shoppingCart.products;

      let totalAmount = shoppingCart.totalAmount;

      totalAmount = 0;

      for (let i = 0; i < shoppingCart.products.length; i++) {
        totalAmount += shoppingCart.products[i].price;
      }

      const updatedCart = { cartId, products, totalAmount };

      await fsPromises.writeFile(cartPath, JSON.stringify(updatedCart));

      return updatedCart;
    },
    deleteFromCart: async (_, args) => {
      const { cartId, productId } = args;

      //hittar i directionary
      const cartPath = path.join(
        __dirname,
        `../data/projects/carts/${cartId}.json`
      );
      const productPath = path.join(
        __dirname,
        `../data/projects/products/${productId}.json`
      );

      //if sats
      const cartExists = await fileExists(cartPath);
      if (!cartExists) return new GraphQLError("That cart does not exist!");

      const productExists = await fileExists(productPath);
      if (!productExists)
        return new GraphQLError("That product does not exist!");

      //läs
      const cartFile = await fsPromises.readFile(cartPath, {
        encoding: "utf-8",
      });

      const productFile = await fsPromises.readFile(productPath, {
        encoding: "utf-8",
      });

      //gör till JS objekt

      let shoppginCart = JSON.parse(cartFile);
      let products = shoppginCart.products;
      let totalAmount = shoppginCart.totalAmount;

      //tar bort produkten på position [i]
      for (let i = 0; i < shoppginCart.products.length; i++) {
        if (shoppginCart.products[i].productId === productId) {
          console.log(shoppginCart.products.price);
          shoppginCart.products.splice(i, 1);
        }
      }

      for (let index = 0; index < products.length; index++) {
        console.log(products[index].price);
        totalAmount = totalAmount - products[index].price;
        
      }
      let id = cartId;

      const updatedCart = { id, totalAmount, products };

      await fsPromises.writeFile(cartPath, JSON.stringify(updatedCart));

      return updatedCart;
    },
  },
};
