"use strict";

const mongoose =
  require("mongoose");

const BuildConfigurationSchema =
  new mongoose.Schema({
    "image": {
      "type": String,
      "required": true
    },
    "extension": String,
    "artifactExtension": String
  });

const TestSchema =
  new mongoose.Schema({
    "input": {
      "type": String,
      "required": true
    },
    "output": {
      "type": String,
      "required": true
    }
  });

const TestConfigurationSchema =
  new mongoose.Schema({
    "image": {
      "type": String,
      "required": true
    },
    "extension": String,
    "preprocess": Boolean,
    "continueOnFailure": Boolean,
    "evaluator": String,
    "tests": {
      "type": [TestSchema],
      "required": true
    }
  });

const ProblemSchema =
  new mongoose.Schema({
    "build": {
      "type": BuildConfigurationSchema
    },
    "test": {
      "type": TestConfigurationSchema,
      "required": true
    }
  });

module.exports =
  ProblemSchema;
