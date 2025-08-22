#!/bin/bash
# agent-config-loader.sh - Centralized configuration and path loader for all agent scripts

# Determine framework paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(dirname "$SCRIPT_DIR")"

# Core configuration files
CONFIG_FILE="${FRAMEWORK_ROOT}/config/agent-config.json"
REGISTRY_FILE="${FRAMEWORK_ROOT}/config/agent-registry.json"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq first." >&2
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration file not found: $CONFIG_FILE" >&2
    exit 1
fi

# Load project root from config
PROJECT_ROOT_REL=$(jq -r '.agent_configuration.project_root' "$CONFIG_FILE")
if [ "$PROJECT_ROOT_REL" = "null" ]; then
    echo "Error: project_root not defined in $CONFIG_FILE" >&2
    exit 1
fi

# Resolve relative path to absolute path
PROJECT_ROOT="$(cd "$FRAMEWORK_ROOT" && cd "$PROJECT_ROOT_REL" && pwd 2>/dev/null)"
if [ -z "$PROJECT_ROOT" ] || [ ! -d "$PROJECT_ROOT" ]; then
    echo "Error: Project root path '$PROJECT_ROOT_REL' does not exist or is not accessible" >&2
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "Error: Project root '$PROJECT_ROOT' is not a git repository" >&2
    exit 1
fi

# Get repository URL from git metadata
REPO_URL=$(git -C "$PROJECT_ROOT" remote get-url origin 2>/dev/null || echo "")
if [ -z "$REPO_URL" ]; then
    echo "Error: Could not determine repository URL from git remote in $PROJECT_ROOT" >&2
    exit 1
fi

# Load database configuration
DB_HOST=$(jq -r '.agent_configuration.database.host' "$CONFIG_FILE")
DB_PORT=$(jq -r '.agent_configuration.database.port' "$CONFIG_FILE")
DB_USER=$(jq -r '.agent_configuration.database.user' "$CONFIG_FILE")
DB_PASSWORD=$(jq -r '.agent_configuration.database.password' "$CONFIG_FILE")
DB_PREFIX=$(jq -r '.agent_configuration.database.prefix' "$CONFIG_FILE")

# Load base directory (required)
BASE_DIR=$(jq -r '.agent_configuration.base_directory' "$CONFIG_FILE")
if [ "$BASE_DIR" = "null" ] || [ -z "$BASE_DIR" ]; then
    echo "Error: base_directory not defined in $CONFIG_FILE" >&2
    exit 1
fi

# Load default branch (required)
DEFAULT_BRANCH=$(jq -r '.agent_configuration.default_branch' "$CONFIG_FILE")
if [ "$DEFAULT_BRANCH" = "null" ] || [ -z "$DEFAULT_BRANCH" ]; then
    echo "Error: default_branch not defined in $CONFIG_FILE" >&2
    exit 1
fi

# Load env file path from config
ENV_FILE_REL=$(jq -r '.agent_configuration.env_file' "$CONFIG_FILE")
if [ "$ENV_FILE_REL" = "null" ] || [ -z "$ENV_FILE_REL" ]; then
    echo "Error: env_file not defined in $CONFIG_FILE" >&2
    exit 1
fi

# Convert env file path to absolute
if [[ "$ENV_FILE_REL" = /* ]]; then
    # Already absolute
    ENV_FILE="$ENV_FILE_REL"
else
    # Relative to framework root
    ENV_FILE="${FRAMEWORK_ROOT}/${ENV_FILE_REL}"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: env file not found: $ENV_FILE" >&2
    echo "Please create the env file or update env_file path in $CONFIG_FILE" >&2
    exit 1
fi

# Resolve BASE_DIR relative to framework root if it's a relative path
if [[ ! "$BASE_DIR" = /* ]]; then
    BASE_DIR="${FRAMEWORK_ROOT}/${BASE_DIR}"
fi

# Export all variables for use by sourcing scripts
export SCRIPT_DIR FRAMEWORK_ROOT CONFIG_FILE REGISTRY_FILE ENV_FILE
export PROJECT_ROOT PROJECT_ROOT_REL REPO_URL
export DB_HOST DB_PORT DB_USER DB_PASSWORD DB_PREFIX
export BASE_DIR DEFAULT_BRANCH

# Function to get agent type configuration
get_agent_config() {
    local agent_type=$1
    local field=$2
    jq -r ".agent_configuration.agent_types.${agent_type}.${field}" "$CONFIG_FILE"
}

# Function to get ID range for agent type
get_agent_id_range() {
    local agent_type=$1
    local min_id=$(get_agent_config "$agent_type" "id_range.min")
    local max_id=$(get_agent_config "$agent_type" "id_range.max")
    echo "$min_id $max_id"
}

# Function to get next available agent ID
get_next_agent_id() {
    local agent_type=$1
    local id_range=($(get_agent_id_range "$agent_type"))
    local min_id=${id_range[0]}
    local max_id=${id_range[1]}
    
    # Ensure registry file exists
    if [ ! -f "$REGISTRY_FILE" ]; then
        mkdir -p "$(dirname "$REGISTRY_FILE")"
        echo '{"agents": [], "last_updated": ""}' > "$REGISTRY_FILE"
    fi
    
    # Get existing agent IDs from registry
    local existing_ids=$(jq -r ".agents[] | select(.type == \"$agent_type\") | .id" "$REGISTRY_FILE" 2>/dev/null | sort -n)
    
    # Find first available ID in range
    for id in $(seq $min_id $max_id); do
        if ! echo "$existing_ids" | grep -q "^$id$"; then
            echo $id
            return 0
        fi
    done
    
    return 1
}