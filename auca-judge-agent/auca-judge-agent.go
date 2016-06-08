package main

import (
    "bytes"
    "flag"
    "log"
    "os"
    "path"
    "reflect"
    "strconv"
    "strings"
    "syscall"
    "encoding/json"
    "encoding/base64"
    "io/ioutil"
    "net/http"
    "os/exec"
    "os/user"
    "path/filepath"

    "github.com/satori/go.uuid"
)

type (
    ConfigurationFormat struct {
        Port             int
        Command          string
        Arguments        []string
        Shell            string
        WorkingDirectory string
        Artifacts        []string
    }

    JSONConfigurationFormat struct {
        Port             *int       `json:"port"`
        Command          *string    `json:"command"`
        Arguments        *[]string  `json:"arguments"`
        Shell            *string    `json:"shell"`
        WorkingDirectory *string    `json:"workingDirectory"`
        Artifacts        *[]string  `json:"artifacts"`
    }
)

type (
    RequestParametersFormat struct {
        Files map[string]string
    }

    JSONRequestParametersFormat struct {
        Files *map[string]string `json:"files"`
    }

    ResponseResultFormat struct {
        Status    int    `json:"status"`
        Stdout    string `json:"stdout"`
        Stderr    string `json:"stderr"`
        Artifacts map[string]*string `json:"artifacts"`
    }
)

const (
    AgentIdentificationEnvironmentKey    = "AUCA_JUDGE_AGENT_ID"
    ExtraConfigurationFileEnvironmentKey = "AUCA_JUDGE_AGENT_CONFIGURATION"
)

const (
    ConfigurationFileName = "auca-judge-agent-configuration.json"
    RequestsDirectoryName = "requests"
)

var (
    Info    *log.Logger
    Warning *log.Logger
    Error   *log.Logger
)

var (
    ID string
    Configuration ConfigurationFormat
)

func setupLoggers() {
    header :=
        "Agent '" + ID + "': "
    flags :=
        log.Ldate | log.Ltime | log.LUTC

    Info =
        log.New(os.Stdout, "INFO: " + header, flags)
    Warning =
        log.New(os.Stdout, "WARNING: " + header, flags)
    Error =
        log.New(os.Stdout, "ERROR: " + header, flags)
}

func formConfigurationFileList(configurationFile string) []string {
    Info.Printf("Forming a configuration file list for '%s'", configurationFile)

    configurationFiles := []string{
        path.Join("/etc", configurationFile),
    }

    currentUser, err := user.Current()
    if err == nil {
        fileName :=
            "." + configurationFile
        fileLocation :=
            path.Join(currentUser.HomeDir, fileName)

        configurationFiles =
            append(configurationFiles, fileLocation)
    }

    workingDirectory, err := os.Getwd()
    if err == nil {
        fileLocation :=
            path.Join(workingDirectory, configurationFile)

        configurationFiles =
            append(configurationFiles, fileLocation)
    }

    environmentConfiguration :=
        os.Getenv(ExtraConfigurationFileEnvironmentKey)
    environmentConfiguration =
        strings.TrimSpace(environmentConfiguration)

    if environmentConfiguration != "" {
        configurationFiles =
            append(configurationFiles, environmentConfiguration)
    }

    return configurationFiles
}

func mergeWithJSONType(destination, jsonType interface{}) {
    destinationElement :=
        reflect.ValueOf(destination).Elem()
    element :=
        reflect.ValueOf(jsonType).Elem()

    for i, count := 0, destinationElement.NumField(); i < count; i++ {
        destinationField :=
            destinationElement.Field(i)
        field :=
            element.Field(i)

        if !field.IsNil() {
            destinationField.Set(field.Elem())
        }
    }
}

func extractEntries(commaSeparatedList string) []string {
    entries :=
        []string{}

    if commaSeparatedList == "" {
        return entries
    }

    unprocessedEntries :=
        strings.Split(commaSeparatedList, ",")

    for _, unprocessedEntry := range unprocessedEntries {
        entry :=
            strings.TrimSpace(unprocessedEntry)

        if entry != "" {
            entries =
                append(entries, entry)
        }
    }

    return entries
}

func mergeConfigurationWithFlags(configuration *ConfigurationFormat) {
    Info.Println("Merging configuration with command-line flags")

    var port int
    flag.IntVar(&port, "port", 8080, "a port to bind to")

    var command string
    flag.StringVar(&command, "command", "", "a command to start")

    var argumentString string
    flag.StringVar(
        &argumentString,
        "arguments",
        "",
        "a list of arguments to the command",
    )

    var shell string
    flag.StringVar(
        &shell,
        "shell",
        "",
        "a command with its parameters to be run in a shell " +
            "with `/bin/sh -c`",
    )

    var workingDirectory string
    flag.StringVar(
        &workingDirectory,
        "workingDirectory",
        ".",
        "a path to a directory to switch to before starting a command " +
            "or shell",
    )

    var artifactString string
    flag.StringVar(
        &artifactString,
        "artifacts",
        "",
        "a list of generated files to send back",
    )

    flag.Parse()

    arguments :=
        extractEntries(argumentString)
    artifacts :=
        extractEntries(artifactString)

    flag.Visit(func(entry *flag.Flag) {
        switch entry.Name {
            case "port":
                configuration.Port =
                    port
            case "command":
                configuration.Command =
                    command
            case "argumentString":
                configuration.Arguments =
                    arguments
            case "shell":
                configuration.Shell =
                    shell
            case "workingDirectory":
                configuration.WorkingDirectory =
                    workingDirectory
            case "artifactString":
                configuration.Artifacts =
                    artifacts
        }
    })
}

func sanitizeConfiguration(configuration *ConfigurationFormat) {
    Info.Println("Sanitizing the configuration")

    workingDirectory :=
        configuration.WorkingDirectory
    workingDirectory =
        strings.TrimSpace(workingDirectory)

    if workingDirectory == "" {
        workingDirectory = "."
    }

    workingDirectory, err := filepath.Abs(workingDirectory)
    if err != nil {
        Warning.Printf(
            "Failed to get an absolute path for the working directory '%s' " +
            "while sanitizing the configuration\n'%s'",
            workingDirectory,
            err,
        )
    } else {
        configuration.WorkingDirectory =
            workingDirectory
    }

    artifacts :=
        configuration.Artifacts

    for i, fileName := range artifacts {
        expandedFileName :=
            os.ExpandEnv(fileName)
        sanitizedFileName :=
            path.Base(expandedFileName)
        artifacts[i] =
            sanitizedFileName
    }

    shell :=
        configuration.Shell
    shell =
        strings.TrimSpace(shell)

    if shell != "" {
        configuration.Command =
            "/bin/sh"
        configuration.Arguments = []string{
            "-c", shell,
        }
        configuration.Shell =
            ""
    }
}

func loadConfiguration(configurationFiles []string) ConfigurationFormat {
    Info.Printf("Scanning configuration files '%s'", configurationFiles)

    configuration := ConfigurationFormat{
        8080,
        "",
        []string{},
        "",
        ".",
        []string{},
    }

    for _, fileLocation := range configurationFiles {
        data, err := ioutil.ReadFile(fileLocation)
        if err != nil {
            Info.Printf(
                "Failed to read the configuration file '%s'\n'%s'",
                fileLocation,
                err,
            )

            continue
        }

        jsonConfiguration :=
            JSONConfigurationFormat{}

        if err := json.Unmarshal(data, &jsonConfiguration); err != nil {
            Info.Printf(
                "Failed to parse the configuration file '%s'\n'%s'",
                fileLocation,
                err,
            )

            continue
        }

        mergeWithJSONType(&configuration, &jsonConfiguration)
    }

    mergeConfigurationWithFlags(&configuration)
    sanitizeConfiguration(&configuration)

    return configuration
}

func prepareDirectories() {
    workingDirectory :=
        Configuration.WorkingDirectory

    Info.Printf(
        "Ensuring the working directory '%s' exists and has a " +
        "proper structure\n",
        workingDirectory,
    )

    if err := os.MkdirAll(workingDirectory, 0700); err != nil {
        Error.Panicf(
            "Failed to create the working directory at '%s'\n%s",
            workingDirectory,
            err,
        )
    }

    requestsDirectory :=
        path.Join(workingDirectory, RequestsDirectoryName)

    if _, err := os.Stat(requestsDirectory); err == nil {
        if err = os.RemoveAll(requestsDirectory); err != nil {
            Error.Panicf(
                "Failed to remove the old requests directory at '%s'\n%s",
                requestsDirectory,
                err,
            )
        }
    }

    if err := os.MkdirAll(requestsDirectory, 0700); err != nil {
        Error.Panicf(
            "Failed to create the requests directory at '%s'\n%s",
            requestsDirectory,
            err,
        )
    }
}

func createDirectoryForRequest(requestID string) (requestDirectory string, err error) {
    Info.Printf(
        "Creating a request directory for the request '%s'\n",
        requestID,
    )

    requestsDirectory :=
        path.Join(Configuration.WorkingDirectory, RequestsDirectoryName)
    requestDirectory =
        path.Join(requestsDirectory, requestID)

    if _, err = os.Stat(requestDirectory); err == nil {
        if err = os.RemoveAll(requestDirectory); err != nil {
            Error.Printf(
                "Failed to remove the old request directory at '%s'\n%s",
                requestDirectory,
                err,
            )

            return
        }
    }

    if err = os.MkdirAll(requestDirectory, 0700); err != nil {
        Error.Printf(
            "Failed to create the request directory at '%s'\n%s",
            requestDirectory,
            err,
        )

        return
    }

    return requestDirectory, nil
}

func removeRequestDirectory(requestDirectory string) {
    Info.Printf("Removing the request directory '%s'\n", requestDirectory)

    if err := os.RemoveAll(requestDirectory); err != nil {
        Error.Printf(
            "Failed to remove the request directory at '%s'\n%s",
            requestDirectory,
            err,
        )
    }
}

func parseBody(request *http.Request) (requestParameters *RequestParametersFormat, err error) {
    Info.Println("Parsing the request body")

    requestParameters =
        &RequestParametersFormat{}

    requestBody, err := ioutil.ReadAll(request.Body)
    if err != nil {
        Error.Printf(
            "Failed to read the body of the request '%s'\n'%s'",
            request,
            err,
        )

        return
    }

    jsonRequestParameters :=
        JSONRequestParametersFormat{}

    if err = json.Unmarshal(requestBody, &jsonRequestParameters); err != nil {
        Error.Printf(
            "Failed to parse the request body '%s'\n'%s'",
            requestBody,
            err,
        )

        return
    }

    mergeWithJSONType(requestParameters, &jsonRequestParameters)

    return requestParameters, nil
}

func saveFilesFromRequest(requestParameters *RequestParametersFormat, location string) error {
    Info.Printf("Saving request files to '%s'\n", location)

    files :=
        requestParameters.Files

    for fileName, encodedData := range files {
        data, err := base64.StdEncoding.DecodeString(encodedData)
        if err != nil {
            Error.Printf(
                "Failed to decode the request file '%s'\n'%s'",
                fileName,
                err,
            )

            return err
        }

        sanitizedFileName :=
            path.Base(fileName)
        fileLocation :=
            path.Join(location, sanitizedFileName)

        if err = ioutil.WriteFile(fileLocation, data, 0700); err != nil {
            Error.Printf(
                "Failed to write the request file '%s' to '%s'\n'%s'",
                fileName,
                fileLocation,
                err,
            )

            return err
        }
    }

    return nil
}

func removeArtifacts(requestDirectory string) {
    Info.Printf(
        "Removing old artifacts from the request directory '%s'\n",
        requestDirectory,
    )

    artifacts :=
        Configuration.Artifacts

    for _, fileName := range artifacts {
        fileLocation :=
            path.Join(requestDirectory, fileName)

        if err := os.Remove(fileLocation); err != nil {
            Info.Printf(
                "Failed to remove the artifact file '%s'\n'%s'",
                fileLocation,
                err,
            )
        }
    }
}

func loadArtifacts(requestDirectory string) map[string]*string {
    Info.Printf(
        "Loading artifacts from the request directory '%s'\n",
        requestDirectory,
    )

    artifactsData :=
        map[string]*string{}
    artifacts :=
        Configuration.Artifacts

    for _, fileName := range artifacts {
        fileLocation :=
            path.Join(requestDirectory, fileName)

        data, err := ioutil.ReadFile(fileLocation)
        if err != nil {
            Warning.Printf(
                "Failed to read the artifact file '%s'\n'%s'",
                fileLocation,
                err,
            )

            artifactsData[fileName] =
                nil

            continue
        }

        encodedData :=
            base64.StdEncoding.EncodeToString(data)
        artifactsData[fileName] =
            &encodedData
    }

    return artifactsData
}

func runCommand(requestDirectory string) (responseResult ResponseResultFormat, err error) {
    responseResult = ResponseResultFormat{}
    responseResult.Status = -1

    command :=
        Configuration.Command
    arguments :=
        Configuration.Arguments

    Info.Printf("Starting the command '%s'\n", command)

    commandLocation, err := exec.LookPath(command)
    if err != nil {
        Error.Printf("Failed to find the command '%s'\n%s", command, err)

        return
    }

    standardOutputBuffer :=
        bytes.Buffer{}
    standardErrorBuffer :=
        bytes.Buffer{}

    childProcess :=
        exec.Command(commandLocation, arguments...)

    childProcess.Dir =
        requestDirectory
    childProcess.Stdout =
        &standardOutputBuffer
    childProcess.Stderr =
        &standardOutputBuffer

    removeArtifacts(requestDirectory)

    exitStatus := 0
    if err = childProcess.Run(); err != nil {
        exitStatus = -1

        if message, ok := err.(*exec.ExitError); ok {
            exitStatus =
                message.Sys().(syscall.WaitStatus).ExitStatus()
        }

        Error.Printf(
            "Failed to run the command '%s'\n%s",
            command,
            err,
        )
    }

    responseResult.Status =
        exitStatus
    responseResult.Stdout =
        standardOutputBuffer.String()
    responseResult.Stderr =
        standardErrorBuffer.String()
    responseResult.Artifacts =
        loadArtifacts(requestDirectory)

    return responseResult, nil
}

func handleProcessPath(responseWriter http.ResponseWriter, request *http.Request) {
    requestID :=
        uuid.NewV4().String()

    Info.Printf("Handling the request '%s'\n", requestID)

    requestDirectory, err := createDirectoryForRequest(requestID)
    if err != nil {
        http.Error(
            responseWriter,
            "failed to prepare request environment",
            http.StatusInternalServerError,
        )

        return
    }
    defer removeRequestDirectory(requestDirectory)

    requestParameters, err := parseBody(request)
    if err != nil {
        http.Error(
            responseWriter,
            "invalid request body",
            http.StatusBadRequest,
        )

        return
    }

    err = saveFilesFromRequest(requestParameters, requestDirectory)
    if err != nil {
        http.Error(
            responseWriter,
            "failed to save request files",
            http.StatusInternalServerError,
        )

        return
    }

    responseParameters, err := runCommand(requestDirectory)
    if err != nil {
        http.Error(
            responseWriter,
            "failed to run the command",
            http.StatusInternalServerError,
        )

        return
    }

    responseBody, err := json.Marshal(responseParameters)
    if err != nil {
        http.Error(
            responseWriter,
            "failed to create a response body",
            http.StatusInternalServerError,
        )

        return
    }

    responseWriter.Header().Set("Content-Type", "application/json")
    if _, err = responseWriter.Write(responseBody); err != nil {
        Error.Printf(
            "Failed to send response data for request '%s'\n%s",
            request,
            err,
        )
    }
}

func startServer() {
    host :=
        ""
    port :=
        strconv.Itoa(Configuration.Port)
    address :=
        host + ":" + port

    Info.Printf("Starting the HTTP server at '%s'\n", address)

    http.HandleFunc("/process", handleProcessPath)
    if err := http.ListenAndServe(address, nil); err != nil {
        Error.Fatal(err)
    }
}

func main() {
    ID = uuid.NewV4().String()
    os.Setenv(AgentIdentificationEnvironmentKey, ID)

    setupLoggers()
    Info.Println("Starting")

    configurationFiles :=
        formConfigurationFileList(ConfigurationFileName)
    Configuration =
        loadConfiguration(configurationFiles)

    prepareDirectories()
    startServer()
}
