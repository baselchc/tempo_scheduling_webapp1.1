#!/bin/bash

# Variables
DB_HOST="localhost"
DB_USER="postgres"
DB_PASSWORD="password"
DB_NAME="Tempo"

# Path to psql (updated based on your system)
PSQL_PATH="/C/Program Files/PostgreSQL/17/bin/psql.exe"

# Execute the schema.sql file
PGPASSWORD="$DB_PASSWORD" "$PSQL_PATH" -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f schema.sql
