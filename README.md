# Crater

[![Build Status](https://travis-ci.org/jedwards1211/crater.svg?branch=master)](https://travis-ci.org/jedwards1211/crater)

## A new app skeleton for Meteor/React

**Note: this is not for beginners!**
(and it's still somewhat experimental)

It's 2016, and your Meteor app has crash landed in the middle of a more advanced JavaScript civilization, leaving a crater full of mangled and poorly forked npm packages and antique build tools.  You climb out of the ruins of your Celestial-Body-as-a-Service and wonder, how can I pick up the pieces and keep going in this new ecosystem?

If you can't start over (i.e. switch to [Meatier](https://github.com/mattkrick/meatier), which I recommend highly) because your codebase is too firmly entrenched in Meteor, then you may find this app skeleton quite useful.

## Features

* You can run any server and client code except Meteor packages outside of Meteor's control (without running it through Isobuild)
* Starts faster than `meteor` dev mode
* Babel 6 with es2015, stage-1 presets by default
* Server uses `babel-register`
* Client code is bundled by Webpack
* Server creates an Express app and generates HTML pages with React SSR
* Automatic server restart via `piping`
* react-hot-loader 3 (beta)
* redux
* react-router
* react-router-redux
* Very customizable
* Dockerfile included
* Webdriver.io + Mocha + Chai integration test setup

## Rationale

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

**Special thanks to [Matt Krick](https://github.com/mattkrick), creator of
[Meatier](https://github.com/mattkrick/meatier) -- I learned a lot from
Meatier, and copped some of its code for this project**

`src/server/index.js` uses `piping` (to enable server restarts when the code changes) and then requires Meteor's
`boot.js` to load all of the Meteor packages.  It then requires `babel-register`, which uses `babel-plugin-meteor-imports`
to rewrite statements like `import {Meteor} from 'meteor/meteor'` to `const {Meteor} = Package.meteor`.  On Meteor
startup, it requires `src/server/server.js`, which sets up an Express server.

The Express server is configured to perform React server-side rendering and added to `WebApp.rawConnectHandlers`.

The client-side code is bundled using Webpack and [meteor-imports-webpack-plugin](https://github.com/luisherranz/meteor-imports-webpack-plugin), and comes with all the usual
goodies in this skeleton: `react-hot-loader`, `redux`, `react-router`, `react-router-redux`.

In dev mode a webpack dev server is run on port 4000, with a proxy to the main app on port 3000.

In production the server-side code is also bundled using Webpack with `extract-text-webpack-plugin` so that it can
render React modules that require `.css` files.

## Where to put things

All of your server code should go in `src/server/index.js` or a file required by it.  You shouldn't require any app
code in `src/index.js`, because the production build makes a server-side Webpack bundle with
`src/server/index.js` as the entry point, so anything you require in `src/index.js` would be duplicated in the
Webpack bundle.

Put anything shared between client and server in `src/universal`.  Many Meteor methods are not
actually isomorphic (e.g. `Meteor.user()`, `Meteor.subscribe()`, `Mongo.Collection.find()`, etc) so you should probably
wrap those `Meteor.isClient`/`Meteor.isServer` blocks in any code shared between client and server.

## Blaze is not supported

See explanation [here](https://github.com/luisherranz/meteor-imports-webpack-plugin#the-bad-things).
A Webpack loader for Spacebars HTML templates could be implemented, but it's not a priority for me.

## Version notes
* **Node**: Tested on the latest Node 4, 5, and 6 in Travis CI.  No effort will be made to support Node < 4.4.7.
* **Webpack**: The `master` branch currently works only with Webpack 1.  If you want to use Webpack 2, check out the [`webpack2` branch](https://github.com/jedwards1211/crater/tree/webpack2).

## Obtaining
```
git clone https://github.com/jedwards1211/crater
cd crater
git remote rename origin skeleton
```
Again, if you want to use webpack 2:
```
git checkout webpack2
```

## Running
Crater doesn't start a Mongo dev database, before running, you must start one by running `mongod` in a separate shell.

**Note: if you're *not* using Node 4, you will need to rebuild the fibers binary for your node version -- see the [Troubleshooting](#troubleshooting) section for more details.**

### Dev mode

Make sure to install deps before running the app for the first time:
```
npm install
```

Then after that, run:
```
npm start
```
And open http://localhost:4000 in your browser. (It runs a webpack dev server on port 4000 and proxies to
the main server)

### Debug mode
```
npm run debug
```
or
```
npm run debug-brk
```
And then go to the usual `node-inspector` URL, which will be printed in the console.

### Prod mode
```
npm run prod
```
And open http://localhost:3000 in your browser.

### Eslint/Flow
```
npm run check
```
Starts a `supervisor` watcher that reruns `eslint` and `flow` when you change anything.

### Build
```
npm run build
```
Everything is output to the `build` directory.
Note that `npm run prod` runs this before starting the app.
`npm start` runs the `build:meteor` script, which partially populates this folder, before starting the app.

## Docker
**Note: the Dockerfile is configured to use Node 4.5, but feel free to change it in your own project.**

First build the docker image (this is currently set up to tag it as `jedwards1211/crater:$(git rev-parse HEAD)`):
```
npm run build:docker
```
Then you can run the docker image using: (requires `docker-compose`)
```
npm run docker
```
And open http://localhost:3000 in your browser.

## Multiple targets

If you need to build multiple targets, read the comments in `buildDir.js` and change it accordingly.  Then run any
commands with the `TARGET` environment variable set to the name of the build target.  You can use
`process.env.TARGET` in your code.

## Testing
```
npm test
```
This runs an integration test that successively runs dev and prod mode via the commands above, and tests that Meteor
integration is working via [PhantomJS](https://www.npmjs.com/package/phantomjs-prebuilt) and
[Webdriver.IO](http://webdriver.io/).

It also tests the docker build, so you need to have `docker` and `docker-compose` installed for the docker test to pass.
