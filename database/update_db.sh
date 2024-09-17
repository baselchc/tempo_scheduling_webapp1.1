# Variables
DB_HOST="localhost"
DB_USER="postgres"
DB_PASSWORD="password"
DB_NAME="Tempo"

# Execute the schema.sql file
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f schema.sql
