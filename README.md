# Crater

## A new app skeleton for Meteor

> Note: this is not for beginners!

Ever since I started using Meteor, Isobuild has been my biggest source of frustration with it, for the following
reasons:
* It made it more difficult to use Webpack with Meteor
* It's hard to customize index.html too much
* It's been horribly slow for me in recent versions
(almost 100 upvotes on this issue! [Meteor build time/refresh time after file save is VERY slow](https://github.com/meteor/meteor/issues/4284))
* I just want to be in control of the initial entry point, period.

Well, thanks to Babel custom resolvers and [meteor-imports-webpack-plugin](https://github.com/luisherranz/meteor-imports-webpack-plugin),
now it's possible to run the app in dev mode and prod without using isobuild to build your code!  (It's only needed to
install and build meteor packages).

This should be a very helpful workaround for [https://github.com/meteor/meteor/issues/4284], because
**it doesn't output any transpiled files in dev mode**.

And for that and other reasons, it tends to start up faster than running the app through Meteor.

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

### Prod mode
```
npm run build
cd build/meteor/bundle/programs/server
npm install
cd <project root>
npm run prod
```

## Testing
```
npm test
```
This runs an integration test that successively runs dev and prod mode via the commands above, and tests that Meteor
integration i working via [PhantomJS](https://www.npmjs.com/package/phantomjs-prebuilt) and
[Webdriver.IO](http://webdriver.io/).
