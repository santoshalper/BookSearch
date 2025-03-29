import express from 'express';
import type { Request, Response } from 'express'
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers} from './schemas/index.js'
import { authenticateToken } from './services/auth.js';

const server = new ApolloServer({
  typeDefs,
  resolvers
});


const startApolloServer = async () => {
  await server.start();
  await db();

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server as any,
    {
      context: authenticateToken as any
    }
  ));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static( '../../client/dist'));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile('../../client/dist/index.html');
    });
  }

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();




// if we're in production, serve client/build as static assets

