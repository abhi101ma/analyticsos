import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    auth: any;
  }
}
