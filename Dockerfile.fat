FROM ubuntu:16.04

ENV GOPATH=/go PATH=/go/bin:$PATH

COPY . $GOPATH/src/github.com/toksaitov/auca-judge-agent
WORKDIR $GOPATH/src/github.com/toksaitov/auca-judge-agent

RUN apt-get update                                  && \
    apt-get install --assume-yes git golang         && \
    go get -d                                       && \
    apt-get purge --assume-yes --auto-remove git    && \
    go install                                      && \
    apt-get purge --assume-yes --auto-remove golang && \
    rm -rf /var/lib/apt/lists/*

ONBUILD COPY auca-judge-agent-configuration.json /agent/
WORKDIR /agent

CMD ["/go/bin/auca-judge-agent"]
