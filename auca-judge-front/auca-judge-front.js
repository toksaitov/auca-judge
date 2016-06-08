"use strict";

const util =
  require("util");

const express =
  require("express");
const bodyParser =
  require("body-parser");
const proxy =
  require("http-proxy-middleware");
const redis =
  require("redis");
const winston =
  require("winston");

const Server =
  express();
const ServerPort =
  8080;
const BackServerURL =
  "http://auca-judge-back:7070"

const UseTaskQueue =
  true;
const QuerySubmissionStateLocally =
  true;

const StateDatabaseConnectionOptions = {
  "host": "auca-judge-state-db",
  "port": 6379
};
const StateDatabase =
  redis.createClient(
    StateDatabaseConnectionOptions
  );

StateDatabase.on("ready", () => {
  Logger.info("Connected to the state database");
});
StateDatabase.on("reconnecting", () => {
  Logger.info("Reconnected to the state database");
});
StateDatabase.on("end", () => {
  Logger.info("Disconnected from the state database");
});
StateDatabase.on("error", error => {
  Logger.error("The state database client has encountered an error");
  Logger.error(error);
});

const Logger =
  new winston.Logger({
    transports: [new winston.transports.Console()]
  });

Server.use(bodyParser.urlencoded({
  "extended": true
}));

Server.use(express.static("public"));

let PathsToProxify =
  [];

if (!UseTaskQueue) {
  PathsToProxify.push("/submit");
}
if (!QuerySubmissionStateLocally) {
  PathsToProxify.push("/submissions");
}

if (PathsToProxify.length > 0) {
  Server.use(proxy(PathsToProxify, { "target": BackServerURL }));
}

if (UseTaskQueue) {
  const QueueDatabaseConnectionOptions = {
    "host": "auca-judge-queue-db",
    "port": 6379
  };
  const QueueDatabase =
    redis.createClient(
      QueueDatabaseConnectionOptions
    );

  QueueDatabase.on("ready", () => {
    Logger.info("Connected to the queue database");
  });
  QueueDatabase.on("reconnecting", () => {
    Logger.info("Reconnected to the queue database");
  });
  QueueDatabase.on("end", () => {
    Logger.info("Disconnected from the queue database");
  });
  QueueDatabase.on("error", error => {
    Logger.error("The queue database client has encountered an error");
    Logger.error(error);
  });

  const mongoose =
    require("mongoose");
  mongoose.model(
    "Task", require("./lib/models/task.js")
  );

  const TaskDatabaseConnectionOptions = {
    "url": "mongodb://auca-judge-task-db:27017/auca_judge",
    "options": { }
  };
  const TaskDatabase =
    mongoose.createConnection(
      TaskDatabaseConnectionOptions["url"],
      TaskDatabaseConnectionOptions["options"]
    );

  TaskDatabase.on("open", () => {
    Logger.info("Connected to the task database");
  });
  TaskDatabase.on("reconnected", () => {
    Logger.info("Reconnected to the task database");
  });
  TaskDatabase.on("close", () => {
    Logger.warn("Disconnected from the task database");
  });
  TaskDatabase.on("error", error => {
    Logger.error("The task database client has encountered an error");
    Logger.error(error);
  });

  function createNewTask(problemID, submission, onResultCallback) {
    let Task =
      TaskDatabase.model("Task");

    let task =
      new Task({
        "problem_id": mongoose.Types.ObjectId(problemID),
        "submission": submission
      });

    task.save((error, task) => {
      if (error) {
        onResultCallback(error);
      } else {
        onResultCallback(error, task.id);
      }
    });
  }

  function queueTask(taskID, onResultCallback) {
    QueueDatabase.rpush("queue:tasks", taskID, (error, reply) => {
      onResultCallback(error, reply);
    });
  }

  function publishTaskQueuedEvent(taskID) {
    QueueDatabase.publish("queue:taskQueued", taskID);
  }

  function createPlaceholderSubmissionInformation(submissionID) {
    let submission = {
      "id": submissionID,
      "status": "in progress"
    };

    let key =
      `submission:${submissionID}`;

    StateDatabase.hmset(key, submission, (error, reply) => {
      if (error) {
        Logger.error(
          "Failed to update submission information " +
          `for ${submissionID}.`
        );
        Logger.error(reply);
        Logger.error(error);
      }
    });
  }

  Server.post("/submit", (request, response) => {
    let processError = parameters => {
      let code =
        parameters["code"];
      let message =
        parameters["message"];
      let responseMessage =
        parameters["response"] || message;
      let error =
        parameters["error"];

      if (message) {
        Logger.error(`${message}\n`);
      }
      if (error)   {
        Logger.error(`exception:\n${error}\n`);
      }
      if (request) {
        Logger.error(`request:\n${util.inspect(request, { "depth": 2 })}\n`);
      }

      if (code && response && responseMessage) {
        response.status(code).json({
          "error": responseMessage
        });
      }
    }

    let problemID =
      request.body["id"];

    if (!problemID) {
      processError({
        "code": 400,
        "message": `The problem ID was not provided.`
      });

      return;
    }

    let submission =
      request.body["submission"];

    if (!submission) {
      processError({
        "code": 400,
        "response": "Submission sources were not provided.",
        "message": `Submission sources for the problem ID '${problemID}' ` +
                   "were not provided."
      });

      return;
    }

    createNewTask(problemID, submission, (error, taskID) => {
      if (error) {
        processError({
          "code": 500,
          "response": "The test system has failed.",
          "error": error,
          "message": "Failed to create a new task for the problem ID " +
                     `'${problemID}'.`
        });

        return;
      }

      queueTask(taskID, error => {
        if (error) {
          processError({
            "code": 500,
            "response": "The test system has failed.",
            "error": error,
            "message": `Failed to add the task '${taskID}' for the problem ` +
                       `'${problemID}' to the task queue.`
          });

          return;
        }

        publishTaskQueuedEvent(taskID);

        createPlaceholderSubmissionInformation(taskID);

        let location = `/submissions/${taskID}`;
        response.redirect(location);
      });
    });
  });
}

if (QuerySubmissionStateLocally) {
  function getSubmissionInformation(submissionID, onResultCallback) {
    let key =
      `submission:${submissionID}`;

    StateDatabase.hgetall(key, (error, submission) => {
      if (!error) {
        if (submission) {
          let results =
            submission["results"];

          if (results) {
            submission["results"] =
              results.split(",");
          }
        }
      }

      onResultCallback(error, submission);
    });
  }

  Server.get("/submissions/:id", (request, response) => {
    let submissionID =
      request.params["id"];

    let processError = parameters => {
      let code =
        parameters["code"];
      let message =
        parameters["message"];
      let responseMessage =
        parameters["response"] || message;
      let error =
        parameters["error"];

      if (message) {
        Logger.error(`${message}\n`);
      }
      if (error)   {
        Logger.error(`exception:\n${error}\n`);
      }
      if (request) {
        Logger.error(`request:\n${util.inspect(request, { "depth": 2 })}\n`);
      }

      if (code && response && responseMessage) {
        response.status(code).json({
          "error": responseMessage
        });
      }
    }

    if (!submissionID) {
      processError({
        "code": 400,
        "message": "The submission ID was not provided."
      });

      return;
    }

    getSubmissionInformation(submissionID, (error, submission) => {
      if (error) {
        processError({
          "code": 400,
          "response": "Invalid submission ID.",
          "error": error,
          "message": "Failed to find a submission with the " +
                    `ID '${submissionID}'.`
        });

        return;
      }

      response.json(submission);
    });
  });
}

Server.listen(ServerPort, () => {
  Logger.info(`auca-judge-front is listening on port ${ServerPort}.`);
});
