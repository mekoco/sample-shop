#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Navigate to backend directory (relative to script location) and run database reset
cd "$SCRIPT_DIR/../backend" && npm run db:reset