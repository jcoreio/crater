#!/usr/bin/env bash

NODE_ENV=development USE_DOTENV=1 babel-node scripts/devServer.js &
NODE_ENV=development USE_DOTENV=1 supervisor -w src/server,src/universal src/index.js
