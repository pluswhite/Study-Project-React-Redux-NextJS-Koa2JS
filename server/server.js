const Koa = require('koa');
const Router = require('koa-router');
const next = require('next');
const dotenv = require('dotenv');
const session = require('koa-session');
const Redis = require('ioredis');

dotenv.config();

const RedisSessionStore = require('./sessionStore');
const auth = require('./auth');

const env = process.env.NODE_ENV;
const isDev = env !== 'production';

const app = next({
  dev: isDev,
});
// redis client, use default config
const redis = new Redis();
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();

  server.keys = [process.env.APP_KEY];
  const SESSION_CONFIG = {
    key: 'app:sess',
    store: new RedisSessionStore(redis),
  };

  server.use(session(SESSION_CONFIG, server));
  auth(server);

  server.use(async (ctx, next) => {
    if (!ctx.session.user) {
      ctx.session.user = {
        name: 'thsi',
      };
    } else {
      // console.log('session is', ctx.session.user);
    }

    await next();
  });

  router.get('/api/user/info', async (ctx, next) => {
    const user = ctx.session.userInfo;

    if (!user) {
      ctx.status = 401;
      ctx.body = '401, Need Login';
    } else {
      ctx.body = user;
      ctx.set('Content-Type', 'application/json');
    }
  });

  server.use(async (ctx, next) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    await next();
  });

  server.use(router.routes());

  server.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
});
