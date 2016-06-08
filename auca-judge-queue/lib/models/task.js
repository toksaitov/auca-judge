"use strict";

const mongoose =
  require("mongoose");

const TaskSchema =
  new mongoose.Schema({
    "problem_id": {
      "type": mongoose.Schema.Types.ObjectId,
      "required": true
    },
    "submission": {
      "type": String,
      "required": true
    }
  });

module.exports =
  TaskSchema;
