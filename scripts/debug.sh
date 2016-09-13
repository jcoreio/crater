#!/usr/bin/env bash
NODE_ENV=development USE_DOTENV=1 babel-node scripts/devServer.js &
node-inspector &
NODE_ENV=development USE_DOTENV=1 supervisor -w src/server,src/universal --debug src/index.js
