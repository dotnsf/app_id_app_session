# App ID App with session

## Overview

Sample application which use IBM AppID, with session.

This application is based on [this](https://github.com/dotnsf/app_id_app).


## How to run on docker

- Set redis server and port in settings.js:

  - `exports.redis_server = 'redis_server';`

  - `exports.redis_port = 6379;`

- Create docker image:

  - `$ docker build -t app_id_app_session .`

- Create docker network:

  - `$ docker network network mynetwork`

- Run Redis image as container:

  - `$ docker run -d --net mynetwork --name redis_server redis`

- Run my image as container:

  - `$ docker run -d -p 8080:8080 --net mynetwork --name app_id_app_session app_id_app_session`

- Access to application:

  - http://localhost:8080/


## Reference

https://s8a.jp/node-js-express-redis

https://stackoverflow.com/questions/41427756/error-redis-connection-to-127-0-0-16379-failed-connect-econnrefused-127-0-0


## Copyright

2021 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.
