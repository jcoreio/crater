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

`src/server/index.js` uses `piping` (to enable server restarts when the code changes) and then uses
`babel-register` with a custom `resolveModuleSource` that shims Meteor imports.  It then requires Meteor's `boot.js`,
and continues running its own ES2015 code in `src/server/main.js`, which sets up an Express server.

The Express server is configured to perform React server-side rendering and added to `WebApp.rawConnectHandlers`.

The client-side code is bundled using Webpack and [meteor-imports-webpack-plugin](https://github.com/luisherranz/meteor-imports-webpack-plugin), and comes with all the usual
goodies in this skeleton: `react-hot-loader`, `redux`, `react-router`, `react-router-redux`.

In production the server-side code is also bundled using Webpack with `extract-text-webpack-plugin` so that it can
render React modules that require `.css` files.

## Where to put things

All of your server code should go in `src/server/server.js` or a file required by it.  You shouldn't require any app
code in `src/server/index.js`, because the production build makes a server-side Webpack bundle with
`src/server/server.js` as the entry point, so anything you require in `src/server/index.js` would be duplicated in the
Webpack bundle.

## Windows not supported yet

Windows is not yet supported because the npm scripts are all written in bash.  It might work with bash from [Cygwin](https://www.cygwin.com/) or [Windows Subsystem for Linux](https://www.google.com/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=install%20windows%20subsystem%20for%20linux)
Until I decide to work on Windows support, you're welcome to make a PR that uses `shelljs` or whatever instead of the bash scripts.

## Blaze is not supported

See explanation [here](https://github.com/luisherranz/meteor-imports-webpack-plugin#the-bad-things).
A Webpack loader for Spacebars HTML templates could be implemented, but it's not a priority for me.

## Version notes
* **Node**: Tested on the latest Node 4, 5, and 6 in Travis CI.  No effort will be made to support Node < 4.4.7.
* **Webpack**: Webpack 2 is not supported yet by `meteor-imports-webpack-plugin`.

## Obtaining
```
git clone https://github.com/jedwards1211/crater
cd crater
git remote rename origin skeleton
```

## Running
Crater doesn't start a Mongo dev database, before running, you must start one by running `mongod` in a separate shell.

**Note: if you're *not* using Node 4, you will need to rebuild the fibers binary for your node version -- see the [Troubleshooting](#troubleshooting) section for more details.**

### Dev mode

Make sure to install deps before running the app for the first time:
```
npm install
```
A postinstall script will run Meteor so that isobuild downloads all of the Meteor packages, then it will make sure the
binaries (like fibers) are rebuild for your Node version.

Then after that, run:
```
npm start
```
And open http://localhost:4000 in your browser. (It runs a webpack dev server on port 4000 and proxies to
the main server)

### Prod mode
Before running prod mode, you need to build the prod version of the app:
```
npm run build
```
Then you need to install Meteor's npm dependencies:
```
cd build/meteor/bundle/programs/server
npm install
cd <project root>
```
(You don't need to repeat the above steps unless you've changed something and need to rebuild.)

Once the app is built, run the following command:
```
npm run prod
```
And open http://localhost:3000 in your browser.

## Docker
**Note: the Dockerfile is configured to use Node 4.5, but feel free to change it in your own project.**

Before running the docker build, you need to build the app:
```
npm run build
```
Then to build the docker image, run:
```
npm run build:docker
```
To run the docker image (requires `docker-compose`):
```
npm run docker
```
And open http://localhost:3000 in your browser.


## Troubleshooting

If you see the following error (or likewise for any other package that uses native code):
```
<your home dir>/.meteor/packages/meteor-tool/.1.4.1_1.msrh2w++os.osx.x86_64+web.browser+web.cordova/mt-os.osx.x86_64/dev_bundle/server-lib/node_modules/fibers/fibers.js:16
	throw new Error('`'+ modPath+ '.node` is missing. Try reinstalling `node-fibers`?');
	^

Error: `<your home dir>/.meteor/packages/meteor-tool/.1.4.1_1.msrh2w++os.osx.x86_64+web.browser+web.cordova/mt-os.osx.x86_64/dev_bundle/server-lib/node_modules/fibers/bin/darwin-x64-v8-5.0/fibers.node` is missing. Try reinstalling `node-fibers`?
```
It means some npm packages used by Meteor are missing binaries for your Node version.
The `postinstall` script should make sure this doesn't happen, but if it fails for some reason, run:
```
npm run rebuild-meteor-bin
```
After that retry `npm start`.

## Testing
```
npm test
```
This runs an integration test that successively runs dev and prod mode via the commands above, and tests that Meteor
integration is working via [PhantomJS](https://www.npmjs.com/package/phantomjs-prebuilt) and
[Webdriver.IO](http://webdriver.io/).

It also tests the docker build, so you need to have `docker` and `docker-compose` installed for the docker test to pass.
