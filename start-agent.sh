#!/bin/bash
# Convenience script to start the agent
# No parameters needed - agent ID and type are embedded

cd "$(dirname "$0")/agent" && ./start-agent.sh
