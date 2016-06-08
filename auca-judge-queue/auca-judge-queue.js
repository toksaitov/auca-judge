const spawn =
  require("child_process").spawn;
const path =
  require("path");

const Queue =
  require("./lib/queue.js");

const BackServerDirectory =
  "../auca-judge-back";

spawn("npm", ["start"], {
  "stdio": "inherit",
  "cwd": path.resolve(BackServerDirectory)
}).on("error", (error) => {
  console.error(
    `Failed to start the back end server at '${BackServerDirectory}'.`
  );
  console.error(error);
});

new Queue().start();
