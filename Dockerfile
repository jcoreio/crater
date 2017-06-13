FROM node:4.5
MAINTAINER Andy Edwards

RUN mkdir -p /usr/app/meteor/bundle/programs/server
WORKDIR /usr/app

ARG NODE_ENV=production
ARG BUILD_DIR=build
ARG TARGET=""

ENV NODE_ENV=$NODE_ENV \
    TARGET=$TARGET \
    NPM_CONFIG_LOGLEVEL=warn \
    BUILD_DIR=$BUILD_DIR

# I install the meteor deps first because I assume those will change less often

COPY $BUILD_DIR/meteor/bundle/programs/server/package.json \
    $BUILD_DIR/meteor/bundle/programs/server/npm-shrinkwrap.json \
    /usr/app/meteor/bundle/programs/server/
RUN cd meteor/bundle/programs/server && npm install

COPY package.json /usr/app/
RUN npm install --production

COPY $BUILD_DIR/ /usr/app/

EXPOSE 80

ENV MONGO_URL=mongodb://mongo:27017/crater \
    ROOT_URL=http://localhost:80 \
    PORT=80 \
    BUILD_DIR=/usr/app

CMD ["node", "index.js"]

