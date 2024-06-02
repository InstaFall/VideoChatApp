require('dotenv').config();
const path = require('path');
const { createServer } = require('http');
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const { getIO, initIO } = require('./socket');

const User = require('./models/user'); // Ensure this model is correctly defined elsewhere

mongoose.set('strictQuery', false);

const typeDefs = `
type User {
  phoneNumber: String!
  fullName: String!
  id: ID!
}
type Token {
  value: String!
  phoneNumber: String!
}
type Query {
  allUsers: [User]!
  getUserByPhoneNumber(phoneNumber: String!): User
  me: User
}
type Mutation {
  register(
    phoneNumber: String!
    fullName: String!
  ): User
  editUserName(
    phoneNumber: String!
    fullName: String!
  ): User
  login(phoneNumber: String!): Token
}
`;

const resolvers = {
  Query: {
    allUsers: async () => await User.find({}),
    getUserByPhoneNumber: async (root, args) => {
      return await User.findOne({ phoneNumber: args.phoneNumber });
    },
    me: () => {
      // Will be used for current user's JWT information in the future.
      return null;
    },
  },
  Mutation: {
    register: async (root, args) => {
      const existingUser = await User.findOne({
        phoneNumber: args.phoneNumber,
      });
      if (existingUser) {
        throw new Error('Phone number is already registered');
      }

      const newUser = new User(args);
      return await newUser.save();
    },
    editUserName: async (root, args) => {
      const { phoneNumber, fullName } = args;
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        throw new Error('User not found');
      }
      user.fullName = fullName;
      await user.save();
      return user;
    },
    login: async (root, { phoneNumber }) => {
      return null; // Maybe not needed---
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

const app = express();

app.use('/', express.static(path.join(__dirname, 'static')));

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const httpServer = createServer(app);
  const port = process.env.PORT || 3500;

  initIO(httpServer);

  httpServer.listen(port, '0.0.0.0', () =>
    console.log(
      `Server running on port ${port} with GraphQL at ${server.graphqlPath}`
    )
  );

  getIO();
}

startServer();
