(function() {
  var TestStatusUpdateTimeout =
    500;
  var Timers =
    [];

  var Net = {
    statusOK: 200,

    get: function(url, onResultCallback) {
      var StateDone =
        4;

      var request =
        new XMLHttpRequest();

      request.open("GET", url, true);

      request.onreadystatechange = function () {
        if (request.readyState != StateDone) {
          return;
        }

        var requestStatus =
          request.status;
        var responseText =
          request.responseText;

        onResultCallback(requestStatus, responseText);
      }

      request.send();
    },

    submit: function(form, onResultCallback) {
      var url =
        form.action;
      var elements =
        form.elements;

      var parameters =
        [].map.call(elements, function(element) {
          var parameter =
            encodeURIComponent(element.name) + "=" +
            encodeURIComponent(element.value);

          return parameter;
        }).join("&");

      this.post(url, parameters, onResultCallback);
    },

    post: function(url, data, onResultCallback) {
      var StateDone =
        4;

      var request =
        new XMLHttpRequest();

      request.open("POST", url, true);

      request.setRequestHeader(
        "Content-Type",
        "application/x-www-form-urlencoded"
      );

      request.onreadystatechange = function () {
        if (request.readyState != StateDone) {
          return;
        }

        var requestStatus =
          request.status;
        var responseText =
          request.responseText;

        onResultCallback(requestStatus, responseText);
      }

      request.send(data);
    }
  };

  function ready(callback) {
    if (document.readyState != "loading") {
      callback();
    } else {
      document.addEventListener(
        "DOMContentLoaded",
        callback
      );
    }
  }

  function clearTimers() {
    Timers.map(function(timer) {
      clearTimeout(timer);
    });
  }

  function reportError(message) {
    var errorField =
      document.querySelector(".results .error");

    if (errorField) {
      errorField.textContent =
        message;
      errorField.style["display"] =
        "block";
    }
  }

  function hideErrorMessage() {
    var errorField =
      document.querySelector(".results .error");

    if (errorField) {
      errorField.textContent =
        "";
      errorField.style["display"] =
        "none";
    }
  }

  function submitForm(form) {
    clearTimers();

    Net.submit(form, function(requestStatus, responseText) {
      if (requestStatus != Net.statusOK) {
        var message =
          "The test system has failed.";

        try {
          message =
            JSON.parse(responseText)["error"];
        } catch (error) { }

        reportError(message);

        return;
      }

      var tests =
        JSON.parse(responseText);

      if (!tests) {
        return;
      }

      var id =
        tests["id"];

      if (!id) {
        return;
      }

      hideErrorMessage();
      clearTestStatusTable();
      buildTestStatusTable(tests["results"]);

      var status =
        tests["status"];

      if (!status || status === "finished" || status === "failed") {
        return;
      }

      var url =
        form.action.replace("submit", "submissions/" + id);

      var timer =
        setTimeout(function() {
          updateTestStatusTable(url)
        }, TestStatusUpdateTimeout);

      Timers.push(timer);
    });
  }

  function updateTestStatusTable(url) {
    clearTimers();

    Net.get(url, function(requestStatus, responseText) {
      if (requestStatus != Net.statusOK) {
        var message =
          "The test system has failed.";

        try {
          message =
            JSON.parse(responseText)["error"];
        } catch (error) { }

        reportError(message);

        return;
      }

      hideErrorMessage();
      clearTestStatusTable();

      var tests =
        JSON.parse(responseText);

      if (tests) {
        buildTestStatusTable(tests["results"]);

        var status =
          tests["status"];

        if (!status || status === "finished" || status === "failed") {
            return;
        }
      }

      var timer =
        setTimeout(function() {
          updateTestStatusTable(url)
        }, TestStatusUpdateTimeout);

      Timers.push(timer);
    });
  }

  function clearTestStatusTable() {
    var tableBody =
      document.querySelector(".results table tbody");

    tableBody.textContent =
      "";
  }

  function buildTestStatusTable(tests) {
    if (!tests) {
      return;
    }

    var tableBody =
      document.querySelector(".results table tbody");

    tests.forEach(function(test, i) {
      var row =
        tableBody.insertRow();
      row.className =
        test;

      var cell =
        null;

      cell =
        row.insertCell();
      cell.textContent =
        (i + 1).toString();

      cell =
        row.insertCell();
      cell.textContent =
        test;
    });
  }

  ready(function() {
    var editor =
      ace.edit("editor");
    var form =
      document.querySelector(".submission > form");

    form.addEventListener("submit", function(event) {
      event.preventDefault();

      var submissionElement =
        form.elements["submission"];

      submissionElement.value =
        editor.getValue();

      submitForm(form);
    });
  });
})();
