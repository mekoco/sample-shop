#!/bin/bash
# Agent configuration file generated during setup
# This file contains database and other configuration details from agent-config.json

# Agent details
AGENT_ID=10
AGENT_TYPE="dev"
AGENT_LABEL="agent-dev:10"

# Claude configuration
CLAUDE_MAX_RETRIES=3

# Agent directories
AGENT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION_FILES_DIR="${SCRIPT_DIR}/action-files"

# Export all variables for use in other scripts
export AGENT_ID AGENT_TYPE AGENT_LABEL
export CLAUDE_MAX_RETRIES
export AGENT_ROOT_DIR SCRIPT_DIR ACTION_FILES_DIR
