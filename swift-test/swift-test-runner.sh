#!/usr/bin/env sh

EXECUTABLE="$1"
INPUT_FILE="$1.input"
OUTPUT_FILE="$1.output"

test -e "$EXECUTABLE"  && \
chmod +x "$EXECUTABLE" && \
./$EXECUTABLE < "$INPUT_FILE" > "$OUTPUT_FILE"
STATUS="$?"

rm "$INPUT_FILE"

exit "$STATUS"
