FROM node:4.5
MAINTAINER Andy Edwards

WORKDIR /usr/app/build

RUN mkdir -p /usr/app/meteor/bundle/programs/server

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG TARGET=""
ENV TARGET $TARGET
ARG BUILD_DIR=build

# I install the meteor deps first because I assume those will change less often

COPY $BUILD_DIR/meteor/bundle/programs/server/package.json \
    $BUILD_DIR/meteor/bundle/programs/server/npm-shrinkwrap.json \
    /usr/app/meteor/bundle/programs/server/
RUN cd meteor/bundle/programs/server && npm install

COPY package.json /usr/app/build/
RUN npm install

COPY $BUILD_DIR/ /usr/app/build/
COPY static/ /usr/app/static/

EXPOSE 80

ENV PORT=80 BUILD_DIR=/usr/app/build

CMD ["node", "index.js"]
