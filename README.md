# Crater

## A new app skeleton for Meteor/React

**Note: this is not for beginners!**
(and it's still somewhat experimental)

It's 2016, and your Meteor app has crash landed in the middle of a more advanced JavaScript civilization, leaving a crater full of mangled and poorly forked npm packages and antique build tools.  You climb out of the ruins of your Celestial-Body-as-a-Service and wonder, how can I pick up the pieces and keep going in this new ecosystem?

If you can't start over (i.e. switch to [Meatier](https://github.com/mattkrick/meatier), which I recommend highly) because your codebase is too firmly entrenched in Meteor, then you may find this app skeleton quite useful.

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

The Express server is configured to perform React server-side rendering, and proxy SockJS requests to Meteor's internal server so that DDP works.

I moved Meteor to port 4000 and put Express on port 3000 by default, so that you can still test the page at
`localhost:3000`.

The client-side code is bundled using Webpack and [meteor-imports-webpack-plugin](https://github.com/luisherranz/meteor-imports-webpack-plugin), and comes with all the usual
goodies in this skeleton: `react-hot-loader`, `redux`, `react-router`, `react-router-redux`.

## Windows not supported yet

Windows is not yet supported because the npm scripts are all written in bash.  It might work with bash from [Cygwin](https://www.cygwin.com/) or [Windows Subsystem for Linux](https://www.google.com/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=install%20windows%20subsystem%20for%20linux)
Until I decide to work on Windows support, you're welcome to make a PR that uses `shelljs` or whatever instead of the bash scripts.

## Version notes
* **Node**: < 4.4.7 won't be supported.  So far I've gotten this to work on:
  * 4.5.0 (though the tests don't quite work properly, even though they pass)
  * 5.10.1
  * 5.12.0
  * 6.3.0
  * 6.5.0
* **Webpack**: Webpack 2 is not supported yet by `meteor-imports-webpack-plugin`.

## Obtaining
```
git clone https://github.com/jedwards1211/crater
cd crater
git remote rename origin skeleton
```

## Running
Crater doesn't start a Mongo dev database, before running, you must start one by running `mongod` in a separate shell.

### Dev mode
Before running the app for the very first time you need to have isobuild download and build all of the Meteor packages for you.  To do that, run the following:
```
cd meteor
meteor
Ctrl-C after app starts up (this is just so Isobuild will install and build all the Meteor package deps)
cd ..
```
(You don't need to repeat the above steps again, unless `meteor/.meteor/local/build` gets messed up for some reason.)

Then you need to install the NPM modules specified in package.json:
```
npm install
```

Then after that, run:
```
npm start
```
And open http://localhost:3000 in your browser.

If you see the following error (or likewise for any other package that uses native code):
```
<your home dir>/.meteor/packages/meteor-tool/.1.4.1_1.msrh2w++os.osx.x86_64+web.browser+web.cordova/mt-os.osx.x86_64/dev_bundle/server-lib/node_modules/fibers/fibers.js:16
	throw new Error('`'+ modPath+ '.node` is missing. Try reinstalling `node-fibers`?');
	^

Error: `<your home dir>/.meteor/packages/meteor-tool/.1.4.1_1.msrh2w++os.osx.x86_64+web.browser+web.cordova/mt-os.osx.x86_64/dev_bundle/server-lib/node_modules/fibers/bin/darwin-x64-v8-5.0/fibers.node` is missing. Try reinstalling `node-fibers`?
```
It means you're trying to run the app with a different version of Node than Meteor 1.4.1 uses, which is okay -- you just have to manually build the fibers binary for your Node version, like this:
```
cd <your home dir>/.meteor/packages/meteor-tool/.1.4.1_1.msrh2w++os.osx.x86_64+web.browser+web.cordova/mt-os.osx.x86_64/dev_bundle/server-lib
npm rebuild fibers
```
And then retry `npm start`.  Hopefully I can find a more robust way to handle cases like this soon.

### Prod mode
Before running prod mode, you need to build the prod version of the app:
```
npm run build
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

## Testing
```
npm test
```
This runs an integration test that successively runs dev and prod mode via the commands above, and tests that Meteor
integration is working via [PhantomJS](https://www.npmjs.com/package/phantomjs-prebuilt) and
[Webdriver.IO](http://webdriver.io/).
