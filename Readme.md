auca-judge-images
=================

*auca-judge-images* is a repository of build and test images for different
programming languages and environments for use by the
[auca-judge](https://github.com/toksaitov/auca-judge) system.

All images use [auca-judge-agent](https://github.com/toksaitov/auca-judge-agent)
to allow the control of build and test tasks inside containers remotely.

# Services

*auca-judge-images* is part of the [auca-judge](https://github.com/toksaitov/auca-judge)
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

* *Docker*, *Docker Compose* `>= 1.11`, `>= 1.7.0`

## Usage

* `docker-compose build` to build all images

## Docker Hub

* [toksaitov/auca-judge-images](https://hub.docker.com/r/toksaitov/auca-judge-images)

## Licensing

All files in the following repository are licensed under the MIT license. See
LICENSE for the full license text.

## Credits

*auca-judge-images* was created by [Dmitrii Toksaitov](https://github.com/toksaitov).
