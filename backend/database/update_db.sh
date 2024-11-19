# // backend/database/update_db.sh

#!/bin/bash

# Variables
DB_HOST="localhost"
DB_USER="postgres"
DB_PASSWORD="password"
DB_NAME="Tempo"

# Try to find psql in common installation paths
PSQL_PATHS=(
    "C:/Program Files/PostgreSQL/17/bin/psql.exe"
    "C:/Program Files/PostgreSQL/16/bin/psql.exe"
    "C:/Program Files/PostgreSQL/15/bin/psql.exe"
    "C:/Program Files/PostgreSQL/14/bin/psql.exe"
)

PSQL_PATH=""

for path in "${PSQL_PATHS[@]}"; do
    if [ -f "$path" ]; then
        PSQL_PATH="$path"
        break
    fi
done

if [ -z "$PSQL_PATH" ]; then
    echo "Error: Could not find psql.exe in common installation paths"
    echo "Please enter the full path to your psql.exe:"
    read -r PSQL_PATH
    
    if [ ! -f "$PSQL_PATH" ]; then
        echo "Error: Invalid path to psql.exe"
        exit 1
    fi
fi

echo "Using psql at: $PSQL_PATH"

# Convert Windows path to MINGW format if needed
if [[ "$OSTYPE" == "msys" ]]; then
    PSQL_PATH=$(cygpath -u "$PSQL_PATH")
fi

# Execute the schema.sql file
PGPASSWORD="$DB_PASSWORD" "$PSQL_PATH" -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f schema.sql

if [ $? -eq 0 ]; then
    echo "Database update completed successfully"
else
    echo "Error updating database"
    exit 1
fi