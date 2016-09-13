#!/usr/bin/env bash

rimraf build
mkdir build
babel src/index.js -o build/index.js
cd meteor
meteor build ../build/meteor --directory
