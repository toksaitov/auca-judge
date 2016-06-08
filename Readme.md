auca-judge
==========

![Sample](http://i.imgur.com/9CdyTGM.png)

*auca-judge* is an online judge system to build and test submissions to help
conducting laboratory classes and programming contests at
[AUCA](https://www.auca.kg/_/software_engineering_/).

*auca-judge* utilizes a task queue and publish/subscribe messaging to scale its
workers' pool across a cluster. *auca-judge* uses hardened containerization and
isolation of build and test runners from the rest of the system to provide an
acceptable level of security to run untrusted user code from user submissions.

# Services

![Architecture](http://i.imgur.com/JLtDjC5.png)

* UI front
  * [auca-judge-front](https://github.com/toksaitov/auca-judge-front)
* Queue service
  * [auca-judge-queue](https://github.com/toksaitov/auca-judge-queue)
* Task runner
  * [auca-judge-back](https://github.com/toksaitov/auca-judge-back)
* Container's control and communication endpoint
  * [auca-judge-agent](https://github.com/toksaitov/auca-judge-agent)
* Images for various programming languages and environments
  * [auca-judge-images](https://github.com/toksaitov/auca-judge-images)

## Prerequisites

* *Docker*, *Docker Compose* `>= 1.11`, `>= 1.7.0`

## Containerization

* `docker-compose up`: to start all services

* `docker-compose up -d`: to start the services in the background

* `docker-compose down`: to stop the services

* `docker-compose exec auca-judge-queue sh -c "cd /auca-judge-back && npm run gulp"`:
  to recreate the `problems` collection inside the `auca-judge-problem-db`
  container and import sample data from the `problems` directory to the service
  database.

* `docker-compose -f docker-compose.yml -f docker-compose.development.yml ...`:
  to mount project directories on the host machine under project directories
  inside containers to allow instant source changes throughout development
  without rebuilds

## Working in a Swarm Cluster Environment

* `docker-compose -f docker-compose.prepare.yml pull`: to download pre-built
  images from Docker Hub on every node

* `docker-compose up [-d]`: to start all services

* `docker-compose exec auca-judge-queue sh -c "cd /auca-judge-back && npm run gulp"`:
  to import sample data from the `problems` directory to the service database

* `docker-compose scale auca-judge-queue=<number of instances>`: to start a
  specific number of instances of the *auca-judge-queue* and spread them across
  the cluster

## Docker Hub

* [toksaitov/auca-judge-front](https://hub.docker.com/r/toksaitov/auca-judge-front)
* [toksaitov/auca-judge-queue](https://hub.docker.com/r/toksaitov/auca-judge-queue)
* [toksaitov/auca-judge-back](https://hub.docker.com/r/toksaitov/auca-judge-back)
* [toksaitov/auca-judge-agent](https://hub.docker.com/r/toksaitov/auca-judge-agent)
* [toksaitov/auca-judge-images](https://hub.docker.com/r/toksaitov/auca-judge-images)

## Sample Usage

Start the system and access `http://localhost:8080` in your browser to open a
page with a sample problem to test the system.

## Licensing

*auca-judge* is licensed under the MIT license. See LICENSE for the full license
text.

## Credits

*auca-judge* was created by [Dmitrii Toksaitov](https://github.com/toksaitov).
