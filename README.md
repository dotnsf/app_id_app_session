# App ID App with session

## Overview

Sample application which use IBM AppID, with session.

This application is based on [this](https://github.com/dotnsf/app_id_app).


## How to run on docker

- Set redis server and port in settings.js:

  - `exports.redis_server = 'redisserver';`

  - `exports.redis_port = 6379;`

- Create docker image:

  - `$ docker build -t yourname/app-id-app-session .`

- Create docker network:

  - `$ docker network network mynetwork`

- Run Redis image as container:

  - `$ docker run -d --net mynetwork --name redisserver redis`

- Run my image as container:

  - `$ docker run -d -p 8080:8080 --net mynetwork --name app-id-app-session yourname/app-id-app-session`

- Access to application:

  - http://localhost:8080/


## How to run on k8s

- Set redis server and port in settings.js:

  - `exports.redis_server = 'redisserver';`

  - `exports.redis_port = 6379;`

- Create docker image:

  - `$ docker build -t yourname/app-id-app-session .`

- Push your docker image:

  - `$ docker login`

  - `$ docker push yourname/app-id-app-session`

- Edit yaml/app_deployment.yaml with your image name

- Run redis as pod:

  - `$ kubectl apply -f yaml/redis_deployment.yaml`

- Run application as pod:

  - `$ kubectl apply -f yaml/app_deployment.yaml`


## Reference

https://s8a.jp/node-js-express-redis

https://stackoverflow.com/questions/41427756/error-redis-connection-to-127-0-0-16379-failed-connect-econnrefused-127-0-0

https://qiita.com/cyberblack28/items/0d7abff8efb33ecc1ca2


## Copyright

2021 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.
