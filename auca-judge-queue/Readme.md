auca-judge-queue
================

*auca-judge-queue* is a task queue service for the [auca-judge](https://github.com/toksaitov/auca-judge)
system.

*auca-judge-queue* periodically checks a task queue database for new tasks,
fetches one if available, gets associated submission data from a task database,
and sends the submission to the [auca-judge-back](https://github.com/toksaitov/auca-judge-agent)
service to process. *auca-judge-queue* can also listen to task queue events, to
wake up and start its work immediately.

# Services

*auca-judge-queue* is part of the [auca-judge](https://github.com/toksaitov/auca-judge)
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
* *etcd* `>= 2.3.0`
* *Redis* `>= 3.0.7`
* *MongoDB* `>= 3.2.5`

## Configuration

*auca-judge-queue* tries to load a configuration files in the JSON format in the
current working directory under the name *auca-judge-queue-configuration.json*

### Configuration Format

```json
{
  "option": "value",
  "option": ["value", "value"],
  "option": 42
}
```

### Configuration Options

* `"periodic": boolean`

  a flag to enable periodic checks of the task queue (set to true by default)

* `"periodicDelay": number`

  time in milliseconds between task queue checks (set to 1000 by default)

* `"backServer": string`

  URL to a working instance of the *auca-judge-back* service that will be used
  to send submissions to (set to "localhost:7070" by default)

* `"databases": object`

  database connection options to the `discovery` database for service discovery
  and health checks, `queue` database for the task queue service, and `task`
  database to fetch submission data.

  Connection options are mostly passed as it is to a database driver. Refer to
  documentation of the current drivers for all available options.

  * discovery: etcd, [node-etcd](https://github.com/stianeikeland/node-etcd)
  * queue: Redis, [node_redis](https://github.com/noderedis/node_redis)
  * task: MongoDB, [mongoose](https://github.com/Automattic/mongoose)

  Database connection options can be overridden with a JSON entry in the
  following environment variables

  * *AUCA_JUDGE_QUEUE_DISCOVERY_DATABASE*
  * *AUCA_JUDGE_QUEUE_QUEUE_DATABASE*
  * *AUCA_JUDGE_QUEUE_TASK_DATABASE*

  By default Redis and Mongo database connection options will be set to point to
  a set of special names (see *Interconnection*) that you can resolve on your
  own (through `/etc/hosts` for example). Absence of etcd connection options
  will disable the use of it.

### Sample Configuration Files

```json
{
  "periodic": true,
  "periodicDelay": 1000,
  "backServer": "http://localhost:7070",
  "databases": {
    "discovery": {
      "hosts": ["localhost:2379"]
    },
    "queue": {
      "host": "localhost",
      "port": "6379"
    },
    "task": {
      "url": "mongodb://localhost:27017/auca_judge"
    }
  }
}
```

## Interconnection

By default the `host` field in connection options for the queue and task
databases will be set to *auca-judge-queue-db* and *auca-judge-task-db*
respectively.

* *auca-judge-queue-db*: resolve to an instance of a Redis database with a task
  queue

* *auca-judge-task-db*: resolve to an instance of a Mongo database with a
  collection of tasks

There are many approaches that you can use for name resolution. You can add
entries to `/etc/hosts` manually, setup a DNS server or utilize Docker Networks
to manage `/etc/hosts` files across containers automatically.

## Usage

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

* [toksaitov/auca-judge-queue](https://hub.docker.com/r/toksaitov/auca-judge-queue)

## Licensing

*auca-judge-queue* is licensed under the MIT license. See LICENSE for the full
license text.

## Credits

*auca-judge-queue* was created by [Dmitrii Toksaitov](https://github.com/toksaitov).
