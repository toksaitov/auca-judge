# Use the `auca-judge-agent` image as a base image.

FROM toksaitov/auca-judge-agent

# Copy the test runner.

COPY c-test-runner.sh /runner/

# Create a working directory for the test agent (specified in the agent's
# configuration file).

RUN mkdir /submission

# Expose the test agent's communication port (set in the agent's
# configuration file).

EXPOSE 7742
