#!/bin/bash
# agent-common-functions.sh - Shared functions for agent setup and management

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Standardized log function that takes level and message
log() {
    local level=$1
    shift
    local message="$@"
    
    case $level in
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}" >&2
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}" >&2
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} ${message}" >&2
            ;;
        INFO)
            echo -e "${BLUE}[INFO]${NC} ${message}" >&2
            ;;
        *)
            echo "${message}" >&2
            ;;
    esac
}

# Legacy functions for backward compatibility
error() {
    log ERROR "$@"
}

warning() {
    log WARNING "$@"
}

info() {
    log INFO "$@"
}

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

# Function to validate agent type
validate_agent_type() {
    local agent_type=$1
    if [[ ! "$agent_type" =~ ^(dev|reviewer|merger|tester)$ ]]; then
        error "Invalid agent type: $agent_type"
        error "Valid types are: dev, reviewer, merger, tester"
        return 1
    fi
    return 0
}

# Function to validate agent ID range
validate_agent_id_range() {
    local agent_id=$1
    local agent_type=$2
    
    case $agent_type in
        dev)
            if [ "$agent_id" -lt 10 ] || [ "$agent_id" -gt 50 ]; then
                error "DEV agent ID must be between 10-50"
                return 1
            fi
            ;;
        tester)
            if [ "$agent_id" -lt 51 ] || [ "$agent_id" -gt 59 ]; then
                error "TESTER agent ID must be between 51-59"
                return 1
            fi
            ;;
        reviewer)
            if [ "$agent_id" -lt 60 ] || [ "$agent_id" -gt 79 ]; then
                error "REVIEWER agent ID must be between 60-79"
                return 1
            fi
            ;;
        merger)
            if [ "$agent_id" -lt 80 ] || [ "$agent_id" -gt 89 ]; then
                error "MERGER agent ID must be between 80-89"
                return 1
            fi
            ;;
    esac
    return 0
}

# Function to setup agent directory and clone repository
setup_agent_directory() {
    local agent_id=$1
    local agent_type=$2
    local repo_url=$3
    local base_dir=$4
    local branch=${5:-main}
    local force=${6:-false}
    
    local repo_name=$(basename "$repo_url" .git)
    local agent_dir="${base_dir}/${repo_name}-${agent_id}-${agent_type}"
    
    # Check if directory exists
    if [ -d "$agent_dir" ]; then
        if [ "$force" = true ]; then
            warning "Agent directory exists, removing: ${agent_dir}"
            rm -rf "$agent_dir"
        else
            error "Agent directory already exists: ${agent_dir}"
            error "Please remove the directory manually if you want to recreate this agent"
            return 1
        fi
    fi
    
    # Clone repository
    log "Cloning repository into $agent_dir..."
    git clone "$repo_url" "$agent_dir" >&2 2>&1
    cd "$agent_dir"
    git checkout "$branch" >&2 2>&1
    
    # Create logs directory
    mkdir -p logs
    
    echo "$agent_dir"
    return 0
}


# Function to load environment variables from .env file
# Supports both absolute and relative paths
load_env_file() {
    local env_file=$1
    
    # Convert relative path to absolute if needed
    if [[ "${env_file}" != /* ]]; then
        # Relative path - try to resolve it
        if [ -f "${env_file}" ]; then
            # File exists relative to current directory
            env_file="$(cd "$(dirname "${env_file}")" && pwd)/$(basename "${env_file}")"
        elif [ -f "${FRAMEWORK_ROOT}/${env_file}" ]; then
            # File exists relative to framework root
            env_file="${FRAMEWORK_ROOT}/${env_file}"
        fi
    fi
    
    if [ ! -f "$env_file" ]; then
        error "Environment file not found: $env_file"
        return 1
    fi
    
    # Source the .env file
    set -a  # Mark variables for export
    source "$env_file"
    set +a  # Stop marking for export
    
    log "Loaded environment from: $env_file"
    return 0
}

# Function to create .env file by copying and modifying project env
create_env_agent_from_project() {
    local agent_id=$1
    local agent_type=$2
    local agent_dir=$3
    local source_env_file=$4
    
    # Check if source env file exists
    if [ ! -f "$source_env_file" ]; then
        error "Source env file not found: $source_env_file"
        return 1
    fi
    
    local target_file="${agent_dir}/.env"
    
    # Copy the source env file to agent directory
    cp "$source_env_file" "$target_file"
    log "Copied env file from $source_env_file to $target_file"
    
    # Add agent-specific header
    local temp_file=$(mktemp)
    {
        echo "# ============================================"
        echo "# Agent-specific configuration"
        echo "# Generated: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "# Agent ID: ${agent_id}"
        echo "# Agent Type: ${agent_type}"
        echo "# ============================================"
        echo ""
        echo "AGENT_ID=${agent_id}"
        echo "AGENT_TYPE=${agent_type}"
        echo "AGENT_LABEL=agent-${agent_type}:${agent_id}"
        echo "AGENT_DIR=${agent_dir}"
        echo ""
        cat "$target_file"
    } > "$temp_file"
    mv "$temp_file" "$target_file"
    
    # Get all agent-specific env var names from the config
    local env_var_names=$(jq -r '.agent_configuration.agent_specific_env_vars[]' "$CONFIG_FILE" 2>/dev/null)
    
    if [ -n "$env_var_names" ]; then
        for env_var_name in $env_var_names; do
            # Get current value from the env file
            local current_value=$(grep "^${env_var_name}[[:space:]]*=" "$target_file" | sed 's/^[^=]*=//' | tr -d '"' | tr -d "'")
            
            if [ -n "$current_value" ]; then
                # Check if the value is a port number (numeric)
                if [[ "$current_value" =~ ^[0-9]+$ ]]; then
                    # Calculate agent-specific value (add agent_id * 10 for ports)
                    local agent_value=$((current_value + agent_id * 10))
                    
                    # Replace the value in the env file
                    sed -i "s/^${env_var_name}[[:space:]]*=.*$/${env_var_name}=${agent_value}/" "$target_file"
                    
                    log "Updated ${env_var_name}: ${current_value} -> ${agent_value}"
                else
                    # For non-numeric values, append agent ID
                    local agent_value="${current_value}_agent_${agent_id}"
                    sed -i "s/^${env_var_name}[[:space:]]*=.*$/${env_var_name}=${agent_value}/" "$target_file"
                    
                    log "Updated ${env_var_name}: ${current_value} -> ${agent_value}"
                fi
            else
                log "Warning: ${env_var_name} not found in source env file"
            fi
        done
    fi
    
    # Update database name to be agent-specific
    local db_name=$(grep "^DATABASE_NAME=" "$target_file" | cut -d'=' -f2)
    if [ -n "$db_name" ]; then
        local agent_db_name="${db_name}_agent_${agent_id}"
        sed -i "s/^DATABASE_NAME=.*$/DATABASE_NAME=${agent_db_name}/" "$target_file"
        log "Updated DATABASE_NAME to: ${agent_db_name}"
        
        # Also update DATABASE_URL if it exists
        if grep -q "^DATABASE_URL=" "$target_file"; then
            sed -i "s|DATABASE_NAME}|DATABASE_NAME}|g" "$target_file"
        fi
    fi
    
    log "Agent .env file created successfully at: $target_file"
    return 0
}

# Function to copy orchestration script and action files
copy_orchestration_script() {
    local agent_type=$1
    local agent_dir=$2
    local scripts_dir=$3
    
    # Create agent folder structure
    local agent_folder="${agent_dir}/agent"
    mkdir -p "${agent_folder}/action-files"
    
    # Generate agent-config.sh with database and other configuration details
    local agent_id=$(grep "^AGENT_ID=" "${agent_dir}/.env" | cut -d'=' -f2)
    local db_name="petshop_db_agent_${agent_id}"
    
    # Get database config from agent-config.json
    local db_host=$(jq -r '.agent_configuration.database.host' "$CONFIG_FILE")
    local db_port=$(jq -r '.agent_configuration.database.port' "$CONFIG_FILE")
    local db_user=$(jq -r '.agent_configuration.database.user' "$CONFIG_FILE")
    local db_password=$(jq -r '.agent_configuration.database.password' "$CONFIG_FILE")
    local claude_max_retries=$(jq -r '.agent_configuration.claude_max_retries // 3' "$CONFIG_FILE")
    
    # Create agent-config.sh with all necessary configuration
    cat > "${agent_folder}/agent-config.sh" << EOF
#!/bin/bash
# Agent configuration file generated during setup
# This file contains database and other configuration details from agent-config.json

# Agent details
AGENT_ID=${agent_id}
AGENT_TYPE="${agent_type}"
AGENT_LABEL="agent-${agent_type}:${agent_id}"

# Claude configuration
CLAUDE_MAX_RETRIES=${claude_max_retries}

# Agent directories
AGENT_ROOT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
ACTION_FILES_DIR="\${SCRIPT_DIR}/action-files"

# Export all variables for use in other scripts
export AGENT_ID AGENT_TYPE AGENT_LABEL
export CLAUDE_MAX_RETRIES
export AGENT_ROOT_DIR SCRIPT_DIR ACTION_FILES_DIR
EOF
    chmod +x "${agent_folder}/agent-config.sh"
    log "Generated agent-config.sh with database configuration"
    
    # Copy the main start-agent.sh script directly
    local script_name="start-agent.sh"
    
    if [ -f "${scripts_dir}/${script_name}" ]; then
        # Copy the script to agent folder
        cp "${scripts_dir}/${script_name}" "${agent_folder}/start-agent.sh"
        chmod +x "${agent_folder}/start-agent.sh"
        log "Copied orchestration script ${script_name} to agent/start-agent.sh"
    else
        warning "Orchestration script not found: ${scripts_dir}/${script_name}"
        return 1
    fi
    
    # Copy required utility scripts to agent folder
    local required_scripts=(
        "claude-utils.sh"
        "json-processor.sh"
        "github-utils.sh"
        "agent-config-loader.sh"  # In case any script needs it
        "agent-common-functions.sh"  # Required by start-agent.sh
    )
    
    for script in "${required_scripts[@]}"; do
        if [ -f "${scripts_dir}/${script}" ]; then
            cp "${scripts_dir}/${script}" "${agent_folder}/${script}"
            chmod +x "${agent_folder}/${script}"
            log "Copied utility script: ${script}"
        else
            warning "Required script not found: ${scripts_dir}/${script}"
        fi
    done
    
    # Copy action files with template variable substitution
    local action_files_dir="${scripts_dir}/agent-commands"
    if [ -d "$action_files_dir" ]; then
        # Copy all markdown files to agent's action-files directory
        for action_file in "${action_files_dir}"/*.md; do
            if [ -f "$action_file" ]; then
                local filename=$(basename "$action_file")
                cp "$action_file" "${agent_folder}/action-files/${filename}"
                log "Copied action file: ${filename}"
            fi
        done
    else
        warning "Action files directory not found: ${action_files_dir}"
    fi
    
    # Create a convenient start script in the agent root
    cat > "${agent_dir}/start-agent.sh" << 'EOF'
#!/bin/bash
# Convenience script to start the agent
# No parameters needed - agent ID and type are embedded

cd "$(dirname "$0")/agent" && ./start-agent.sh
EOF
    chmod +x "${agent_dir}/start-agent.sh"
    log "Created convenience start script in agent root"
    
    return 0
}

# Function to show dependency installation instructions (no auto-install)
show_dependency_instructions() {
    local agent_dir=$1
    
    local has_deps=false
    
    if [ -f "${agent_dir}/package.json" ]; then
        log "Note: npm dependencies detected but not installed"
        log "To install: cd ${agent_dir} && npm install"
        has_deps=true
    fi
    
    if [ -f "${agent_dir}/requirements.txt" ]; then
        log "Note: Python dependencies detected but not installed"
        log "To install: cd ${agent_dir} && pip install -r requirements.txt"
        has_deps=true
    fi
    
    if [ "$has_deps" = false ]; then
        log "No dependency files detected"
    fi
    
    return 0
}

# Function to create database for agent
create_agent_database() {
    local agent_id=$1
    local agent_type=$2
    local db_name=$3
    local db_host=${DB_HOST:-localhost}
    local db_port=${DB_PORT:-5432}
    local db_user=${DB_USER:-postgres}
    local db_password=${DB_PASSWORD:-postgres}
    
    # Create database for all agent types (dev, reviewer, merger)
    log "Creating database for ${agent_type^^} agent..."
    log "Database name: $db_name"
    log "Connection: ${db_user}@${db_host}:${db_port}"
    
    # Build connection URI
    local db_uri="postgresql://${db_user}:${db_password}@${db_host}:${db_port}/postgres"
    
    # First check if database exists
    log "Checking if database exists..."
    local db_exists=$(timeout 5 psql "${db_uri}" -tAc "SELECT 1 FROM pg_database WHERE datname='${db_name}'" 2>/dev/null || echo "0")
    
    if [ "$db_exists" = "1" ]; then
        warning "Database already exists: $db_name"
        log "Using existing database"
    else
        # Try to create the database
        log "Creating database..."
        local db_error
        db_error=$(timeout 5 psql "${db_uri}" -c "CREATE DATABASE ${db_name};" 2>&1)
        local db_result=$?
        
        if [ $db_result -eq 0 ]; then
            log "Database created: $db_name"
        elif [ $db_result -eq 124 ]; then
            error "Database creation timed out after 5 seconds"
            error "Connection string: ${db_uri}"
            error "Please check your PostgreSQL connection settings"
            return 1
        else
            error "Failed to create database: $db_name"
            error "Database host: $db_host:$db_port"
            error "Database user: $db_user"
            error "Error details: $db_error"
            error ""
            error "Please ensure PostgreSQL is running and accessible."
            error "To start PostgreSQL:"
            error "  - On Ubuntu/Debian: sudo systemctl start postgresql"
            error "  - On macOS: brew services start postgresql"
            error "  - Using Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
            return 1
        fi
    fi
    
    return 0
}


# Function to register agent ID as taken
register_agent_id() {
    local agent_id=$1
    local agent_type=$2
    local registry_file=$3
    
    if [ ! -f "$registry_file" ]; then
        # Create new registry file if it doesn't exist
        echo '{"agents": [], "last_updated": ""}' > "$registry_file"
    fi
    
    # Check if agent ID is already registered
    local exists=$(jq ".agents[] | select(.id == $agent_id and .type == \"$agent_type\")" "$registry_file")
    
    if [ -z "$exists" ]; then
        local temp_registry=$(mktemp)
        # Add new agent ID to registry (only ID and type)
        jq ".agents += [{
            \"id\": $agent_id,
            \"type\": \"$agent_type\"
        }] | .last_updated = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" "$registry_file" > "$temp_registry"
        mv "$temp_registry" "$registry_file"
        log "Agent ID ${agent_id} registered for type ${agent_type}"
    else
        warning "Agent ID ${agent_id} already registered for type ${agent_type}"
    fi
    return 0
}

# Function to unregister agent ID
unregister_agent_id() {
    local agent_id=$1
    local agent_type=$2
    local registry_file=$3
    
    if [ ! -f "$registry_file" ]; then
        warning "Registry file not found"
        return 1
    fi
    
    local temp_registry=$(mktemp)
    # Remove agent ID from registry
    jq ".agents = [.agents[] | select(.id != $agent_id or .type != \"$agent_type\")] |
        .last_updated = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" "$registry_file" > "$temp_registry"
    mv "$temp_registry" "$registry_file"
    log "Agent ID ${agent_id} unregistered for type ${agent_type}"
    return 0
}
# Function to initialize agent environment
initialize_agent() {
    # Set up basic agent environment
    if [ -z "$AGENT_ID" ] || [ -z "$AGENT_TYPE" ]; then
        log ERROR "AGENT_ID and AGENT_TYPE must be set"
        return 1
    fi
    
    # Create required directories if they don't exist
    if [ -n "$AGENT_ROOT_DIR" ]; then
        mkdir -p "$AGENT_ROOT_DIR/logs" 2>/dev/null || true
    fi
    
    # Set default values for optional variables
    export CLAUDE_MAX_RETRIES=${CLAUDE_MAX_RETRIES:-3}
    export CLAUDE_RETRY_DELAY=${CLAUDE_RETRY_DELAY:-5}
    
    log INFO "Agent initialized: ${AGENT_TYPE} Agent ${AGENT_ID}"
    return 0
}
