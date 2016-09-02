# Crater

## A new app skeleton for Meteor

**Note: this is not for beginners!**

Ever since I started using Meteor, Isobuild has been my biggest source of frustration with it, for the following
reasons:
* It made it more difficult to use Webpack with Meteor
* It's hard to customize index.html too much
* It's been horribly slow for me in recent versions
([Meteor build time/refresh time after file save is VERY slow](https://github.com/meteor/meteor/issues/4284) --
over 90 upvotes and it's been open since April!)
* I just want to be in control of the initial entry point, period.

Well, thanks to Babel custom resolvers and [meteor-imports-webpack-plugin](https://github.com/luisherranz/meteor-imports-webpack-plugin),
now it's possible to build and run the app without using isobuild on your userland code!  (It's only needed to
install and build meteor packages).

This should be a very helpful workaround for [https://github.com/meteor/meteor/issues/4284], because
**it doesn't output any transpiled files in dev mode**.

And for that and other reasons, this skeleton tends to start up faster than running the app through Meteor.

## How it works

**Special thanks to [Meatier](https://github.com/mattkrick/meatier) for the inspiration for a lot of the app structure!**

`src/server/index.js` uses `piping` (to enable server restarts when the code changes) and then uses
`babel-register` with a custom `resolveModuleSource` that shims Meteor imports.  It then requires Meteor's `boot.js`,
and continues running its own ES2015 code in `src/server/main.js`, which sets up an Express server.

The Express server is configured to perform React server-side rendering, and proxy SockJS requests to Meteor's internal server so that DDP works.

The client-side code is bundled using Webpack and [meteor-imports-webpack-plugin](https://github.com/luisherranz/meteor-imports-webpack-plugin), and comes with all the usual
goodies in this skeleton: `react-hot-loader`, `redux`, `react-router`, `react-router-redux`.

## Obtaining
```
git clone https://github.com/jedwards1211/crater
cd crater
git remote rename origin skeleton
```

## Running

### Dev mode
```
npm start
```

Then navigate to `localhost:9000`.

### Prod mode
```
npm run build
cd build/meteor/bundle/programs/server
npm install
cd <project root>
npm run prod
```

Then navigate to `localhost:9000`.

## Testing
```
npm test
```
This runs an integration test that successively runs dev and prod mode via the commands above, and tests that Meteor
integration is working via [PhantomJS](https://www.npmjs.com/package/phantomjs-prebuilt) and
[Webdriver.IO](http://webdriver.io/).
