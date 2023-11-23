FROM node:21-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . ./

# Declare build-time arguments
ARG SERVER_HOST
ARG SERVER_PORT

# Set environment variables with default values for run-time
ENV SERVER_HOST=${SERVER_HOST:-localhost}
ENV SERVER_PORT=${SERVER_PORT:-3000}

RUN echo "serverhost = $SERVER_HOST, serverport = $SERVER_PORT"

RUN npm run build

RUN rm -rf assets

EXPOSE $SERVER_PORT

CMD [ "npm", "run", "start:socket" ]