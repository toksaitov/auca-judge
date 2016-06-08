auca-judge-back
===============

*auca-judge-back* is a build and test orchestration service for the
[auca-judge](https://github.com/toksaitov/auca-judge) system.

*auca-judge-back* controls the container runtime to start build and test
container [images](https://github.com/toksaitov/auca-judge-agent), issue build
and test requests to instances of [auca-judge-agent](https://github.com/toksaitov/auca-judge-agent)
inside, get results back and save them in a state database.

# Services

*auca-judge-back* is part of the [auca-judge](https://github.com/toksaitov/auca-judge)
system to test code submissions to help conducting laboratory classes and
programming contests at [AUCA](https://auca.kg).

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

* *Node.js*, *npm* `>=4.4.4`, `>=2.15.2`
* *Docker*, *Docker Compose* `>= 1.11`, `>= 1.7.0`
* *Redis* `>= 3.0.7`
* *MongoDB*, *MongoDB Tools* `>= 3.2.5`

## Communication

*auca-judge-back* responds to the following HTTP requests

**POST** */submit*

```
Content-Type: application/x-www-form-urlencoded

id=<problem ID>&&submission=<urlencoded sources>&&[submission_id=<optional custom submission ID>]
```

For the */submit* request *auca-judge-back* creates a new submission entry in
the status database, loads a problem for the provided ID from the problem
database, starts a build container if necessary, sends data to the build agent
inside the container, waits for a compiled artifact, sequentially starts
containers for each test case, sends compiled or raw artifacts with input data
to test agents, waits for results, compares them with correct data, finally,
saves test reports, errors, general task information to a status database.

Custom submission IDs can only be used in a trusted environment. For any other
case *auca-judge-back* will generate a random version 4 UUID.

*auca-judge-back* will instantly send a reply upon successful task submission.
A client should query a status database to get progress information on its own.

* *302*: success, the client can check the progress at the destination specified
  in the `location` header. The destination URL will contain a path in the form
  `/submissions/<new submission ID>`.

* *400*: invalid submission parameters (`id` or `submission`), details can be
  found in the body of the reply

* *429* the maximum number of simultaneous submissions in progress was reached,
  the client can repeat its request later

* *500*: the test system has failed, details can be found in the body of the
  reply

**GET** */submission/<submission ID>*

The `/submission/<submission ID>` path returns information from the status
database about a submission under the specified ID.

```json
{
  "id": "submission ID",
  "status": "in progress|building|testing|failed|finished",
  "results": ["passed", "passed", "failed"]
}
```

## Interconnection

Ensure that the following hosts can be resolved into IP addresses of the actual
services on your setup

* *auca-judge-state-db*: resolve to an instance of a Redis database with states
  of submissions

* *auca-judge-problem-db*: resolve to an instance of a Mongo database with a
  collection of problems

Note that the *auca-judge-problem-db* and *auca-judge-task-db* hosts used by
other *auca-judge* services can both point to the same database instance.

There are many approaches that you can use for name resolution. You can add
entries to `/etc/hosts` manually, setup a DNS server or utilize Docker Networks
to manage `/etc/hosts` files across containers automatically.

Ensure there is a way to connect to an instance of Docker Engine.

If you would like to run the service outside of a Docker container, ensure to
remove the Docker network entry in `auca-judge-back.js`

```javascript
const BuildAgentConnectionOptions = {
  "port": "7742"
  // "network": "aucajudge_default"
};
const TestAgentConnectionOptions = {
  "port": "7742"
  // "network": "aucajudge_default"
};
```

## Usage

First, build all the images in [auca-judge-images](https://github.com/toksaitov/auca-judge-images).

* `npm install`: to install dependencies

* `npm start`: to start the server

## Containerization

* `docker-compose up`: to start the service

* `docker-compose up -d`: to start the service in the background

* `docker-compose down`: to stop the service

* `docker-compose -f docker-compose.yml -f docker-compose.development.yml
   [-f docker-compose.gpu.yml] ...`: to mount the project directory on the host
  machine under a project directory inside the container to allow instant source
  changes throughout development without rebuilds

## Docker Hub

[toksaitov/auca-judge-back](https://hub.docker.com/r/toksaitov/auca-judge-back)

## Licensing

*auca-judge-back* is licensed under the MIT license. See LICENSE for the full
license text.

## Credits

*auca-judge-back* was created by [Dmitrii Toksaitov](https://github.com/toksaitov).
