"use strict";

function removeContainer(container, onResultCallback) {
  let options = {
    "v": true,
    "force": true
  };

  let dummy =
    () => { };

  container.remove(options, onResultCallback || dummy);
}

function removeContainers(containers) {
  containers.forEach(container => {
    removeContainer(container);
  });
}

exports.removeContainer =
  removeContainer;
exports.removeContainers =
  removeContainers;
