FROM node:5.12
MAINTAINER Andy Edwards

RUN mkdir -p /usr/app/meteor/bundle/programs/server
WORKDIR /usr/app

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# I install the meteor deps first because I assume those will change less often

COPY build/meteor/bundle/programs/server/package.json \
#    build/meteor/bundle/programs/server/npm-shrinkwrap.json \
    /usr/app/meteor/bundle/programs/server/
RUN cd meteor/bundle/programs/server && npm install

COPY package.json /usr/app/
RUN npm install

COPY build/ /usr/app/

EXPOSE 80

ENV MONGO_URL=mongodb://mongo:27017/crater \
    ROOT_URL=http://localhost:80 \
    EXPRESS_PORT=80 \
    PORT=3000 \
    HTTP_FORWARDED_COUNT=1

CMD ["node", "server/index.js"]
