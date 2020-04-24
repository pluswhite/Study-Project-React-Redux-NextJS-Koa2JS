const Koa = require('koa');
const Router = require('koa-router');
const next = require('next');
const dotenv = require('dotenv');
const session = require('koa-session');

const env = process.env.NODE_ENV;
const isDev = env !== 'production';

dotenv.config();

const app = next({
  dev: isDev,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();

  server.keys = [process.env.APP_KEY];
  const SESSION_CONFIG = {
    key: 'app:sess',
  };

  server.use(session(SESSION_CONFIG, server));

  server.use(async (ctx, next) => {
    if (!ctx.session.user) {
      ctx.session.user = {
        name: 'thsi',
      };
    } else {
      console.log('session is', ctx.session);
    }

    await next();
  });

  server.use(async (ctx, next) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    await next();
  });

  server.use(router.routes());

  server.listen(3000, () => {
    console.log('Koa server is running on port 3000');
  });
});
