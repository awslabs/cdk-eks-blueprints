#!/bin/bash

# Customer Issue Debug Script
# Usage: ./debug.sh <filename> [cdk-command]
# Global setup: npm link (run once in project root)
# 
# Quick Setup:
# 1. Run: ./debug.sh ack-fails
# 2. Edit examples/ack-fails.ts with customer code
# 3. Run: ./debug.sh ack-fails synth (or deploy)
#
# The script will:
# - Copy debug-template.ts to your filename if it doesn't exist
# - Set DEBUG_FILE and run the CDK command

if [ -z "$1" ]; then
    echo "Usage: $0 <filename> [cdk-command]"
    echo "Example: $0 ack-fails synth"
    exit 1
fi

FILENAME="$1"
CDK_CMD="${2:-synth}"
DEBUG_FILE="${FILENAME}.ts"

# Copy template if file doesn't exist
if [ ! -f "examples/${DEBUG_FILE}" ]; then
    cp examples/debug-template.ts "examples/${DEBUG_FILE}"
    echo "Created examples/${DEBUG_FILE} from template"
    echo "Edit the file with customer code, then run: $0 $FILENAME $CDK_CMD"
    exit 0
fi

# Run CDK command
export DEBUG_FILE
npm run debug $CDK_CMD