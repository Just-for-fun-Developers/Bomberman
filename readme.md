# Bomberman Multiplayer Phaser3 Game

## Setup

### Requesities

If you don’t have Node.js installed, [install it from here](https://nodejs.org/en/) (Node.js version >= 14.6.0 required)

### Install the requirements

```bash
  $ npm install
```

### Run the client-side app

```bash
  $ npm run dev
```

### Run the server-side socket-io app

```bash
  $ npm run start:socket
```
## Steps to ship in production

- Login with docker Hub
- Build the image with docker-compose like
```bash
  $ docker-compose up -d --build
```
- Change the name of the image '<image_name>' to the one of the dockerhub user like '<username_dockerhub/image_name_repository:some_tag>' like
```bash
  $ docker image tag <image_name> <username_dockerhub/image_name_repository:some_tag>
```
- Push image to repository in DockerHub
```bash
  $ docker push <username_dockerhub/image_name_repository:some_tag>
```
- After this your image is in Dockerhub, so you need to work in your server, clone the git repository of the proyect with the respecting docker-compose.yml file.
- The configuración of the docker-compose.yml must be like:
```
version: '3'
services:
  name-app:
    build: .
    image: username_dockerhub/image_name_repository:some_tag
    ports:
      - '3000:3000'
```
- Run the following command to create the container based in the image
```bash
  $ docker-compose up -d
```