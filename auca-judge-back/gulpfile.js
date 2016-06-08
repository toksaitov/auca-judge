"use strict";

const fs =
  require("fs");
const path =
  require("path");

const gulp =
  require("gulp");
const mongoose =
  require("mongoose");
mongoose.model(
  "Problem", require("./lib/models/problem.js")
);

const ProblemDirectory =
  "problems";

const ProblemDatabaseConnectionOptions = {
  "url": "mongodb://auca-judge-problem-db:27017/auca-judge",
  "options": { }
};


function formProblemListForDirectory(directory) {
  let entries =
    fs.readdirSync(directory);

  entries =
    entries.map(entry => path.join(directory, entry));
  entries =
    entries.filter(
      entry => (/^.*\.json$/).test(entry) && fs.statSync(entry).isFile()
    );

  return entries;
}

function removeProblemCollection(onFinishCallback) {
  console.log(`Removing the collection 'problems'.`);

  let Problem =
    mongoose.model("Problem");

  Problem.remove({}, error => {
    if (error) {
      console.error(error);
      throw error;
    }

    onFinishCallback();
  });
}

function importProblem(problemFile, onFinishCallback) {
  let problemData =
    JSON.parse(fs.readFileSync(problemFile, "utf8"));

  problemData["_id"] =
    new mongoose.Types.ObjectId(problemData["_id"]["$oid"]);

  console.log(`Importing the document '${problemFile}'.`);

  let Problem =
    mongoose.model("Problem");

  let problem =
    new Problem(problemData);

  problem.save(error => {
    if (error) {
      console.error(error);
      throw error;
    }

    onFinishCallback();
  });
}

function importProblems(problemFiles, onFinishCallback) {
  let problemFile =
    problemFiles.shift();

  if (problemFile) {
    importProblem(problemFile, () => {
      importProblems(problemFiles, onFinishCallback);
    });
  } else {
    mongoose.disconnect(() => {
      onFinishCallback();
    });
  }
}

gulp.task("problems", onFinishCallback => {
  mongoose.connect(
    ProblemDatabaseConnectionOptions["url"],
    ProblemDatabaseConnectionOptions["options"]
  );

  removeProblemCollection(() => {
    let problemFiles =
      formProblemListForDirectory(ProblemDirectory);

    importProblems(problemFiles, onFinishCallback);
  });
});

gulp.task("default", ["problems"]);
