auca-judge-front
================

![Sample](http://i.imgur.com/9CdyTGM.png)

*auca-judge-front* is a web front end for the [auca-judge](https://github.com/toksaitov/auca-judge)
system.

Currently *auca-judge-front* sends a sample page with scripts to make
submissions to *auca-judge-back* (the build and test orchestrator) and query
results from the status database.

# Services

*auca-judge-front* is part of the [auca-judge](https://github.com/toksaitov/auca-judge)
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
* *MongoDB* `>= 3.2.5`

## Communication

*auca-judge-front* responds to the following HTTP requests

**GET** */*

For `/` *auca-judge-front* returns a page with a sample problem.

**POST** */submit*

The `/submit` path can be passed from *auca-judge-front* to the
*auca-judge-back* to make a new submission. Refer to
[documentation](https://github.com/toksaitov/auca-judge-back) of the
*auca-judge-back* service for more information.

Alternatively, developers can enable an option inside sources to use a task
queue service of the *auca-judge* system. In this case *auca-judge-front* will
create a new task in the task database and add its ID to a task queue database.
Instances of the *auca-judge-queue* service will be notified and any unoccupied
worker can start processing the task as soon as possible.

**GET** */submission/<submission ID>*

The `/submission/<submission ID>` path can be passed from *auca-judge-front* to
the *auca-judge-back* to fetch information about the specified submission. Refer
to [documentation](https://github.com/toksaitov/auca-judge-back) of the
*auca-judge-back* service for more information.

Alternatively, developers can enable an option inside sources to query
information from the status database about a submission under the specified ID
locally.

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
  of submissions (only if states are being queried locally)

* *auca-judge-queue-db*: resolve to an instance of a Redis database with a task
  queue (only if the task queue was enabled in the program's sources)

* *auca-judge-task-db*: resolve to an instance of a Mongo database with a
  collection of tasks (only if the task queue was enabled in the program's
  sources)

* *auca-judge-back*: resolve to an instance of *auca-judge-back* service (only
  if the task queue was not enabled in the program's sources)

Note that *auca-judge-state-db* and *auca-judge-queue-db* can point to the same
database.

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

[toksaitov/auca-judge-front](https://hub.docker.com/r/toksaitov/auca-judge-front)

## Licensing

*auca-judge-front* is licensed under the MIT license. See LICENSE for the full
license text.

## Credits

*auca-judge-front* was created by [Dmitrii Toksaitov](https://github.com/toksaitov).
