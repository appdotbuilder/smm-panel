
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  updateUserInputSchema,
  generateApiKeyInputSchema,
  createCategoryInputSchema,
  createServiceInputSchema,
  updateServiceInputSchema,
  createOrderInputSchema,
  updateOrderInputSchema,
  createTransactionInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { generateApiKey } from './handlers/generate_api_key';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createService } from './handlers/create_service';
import { getServices } from './handlers/get_services';
import { getServicesByCategory } from './handlers/get_services_by_category';
import { updateService } from './handlers/update_service';
import { createOrder } from './handlers/create_order';
import { getOrders } from './handlers/get_orders';
import { updateOrder } from './handlers/update_order';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { processDeposit } from './handlers/process_deposit';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  generateApiKey: publicProcedure
    .input(generateApiKeyInputSchema)
    .mutation(({ input }) => generateApiKey(input)),

  // Category management
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  // Service management
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),

  getServices: publicProcedure
    .query(() => getServices()),

  getServicesByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(({ input }) => getServicesByCategory(input.categoryId)),

  updateService: publicProcedure
    .input(updateServiceInputSchema)
    .mutation(({ input }) => updateService(input)),

  // Order management
  createOrder: publicProcedure
    .input(createOrderInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => {
      const { userId, ...orderInput } = input;
      return createOrder(orderInput, userId);
    }),

  getOrders: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(({ input }) => getOrders(input?.userId)),

  updateOrder: publicProcedure
    .input(updateOrderInputSchema)
    .mutation(({ input }) => updateOrder(input)),

  // Transaction management
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),

  getTransactions: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(({ input }) => getTransactions(input?.userId)),

  processDeposit: publicProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(({ input }) => processDeposit(input.transactionId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`SMM Panel TRPC server listening at port: ${port}`);
}

start();
