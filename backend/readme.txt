# Tempo Scheduling WebApp Database Setup

## Dependencies
Before starting, ensure you have the following installed:
- Node.js (version 14 or later)
- npm (usually comes with Node.js)
- PostgreSQL (version 13 or later)
- Git Bash (for Windows users)

npm packages required:
- express
- next
- react
- react-dom
- pg (node-postgres)
- dotenv
- cors
- body-parser
- @clerk/nextjs
- svix (for webhook handling)

To install these npm packages, run the following command in your project directory:

## 1. Install PostgreSQL
1. Download PostgreSQL from the official website: https://www.postgresql.org/download/windows/
2. Run the installer and follow the installation wizard.
3. When prompted, set the password to "password" (Note: This is for development purposes only. Use a strong password in production).
4. Remember the port number (default is 5432).
5. Complete the installation.

## 2. Install pgAdmin 4
1. Download pgAdmin 4 from: https://www.pgadmin.org/download/pgadmin-4-windows/
2. Run the installer and follow the installation wizard.
3. Complete the installation.

## 3. Set Up the Database
1. Open pgAdmin 4.
2. In the left sidebar, right-click on 'Servers' and select 'Create' > 'Server'.
3. In the 'General' tab, name your server Tempo.
4. In the 'Connection' tab:
   - Host name/address: localhost
   - Port: 5432 (or the port you chose during PostgreSQL installation)
   - Maintenance database: postgres
   - Username: postgres
   - Password: password
5. Click 'Save' to connect to the server.
6. Right-click on 'Databases' and select 'Create' > 'Database'.
7. Name the database 'Tempo' and click 'Save'.

## 4. Set Up and Run the Bash Script
1. Install Git Bash: https://git-scm.com/download/win
2. Add PostgreSQL to your system PATH:
   a. Right-click on 'This PC' or 'My Computer' and select 'Properties'.
   b. Click on 'Advanced system settings'.
   c. Click on 'Environment Variables'.
   d. Under 'System variables', find and select the 'Path' variable, then click 'Edit'.
   e. Click 'New' and add the path to your PostgreSQL bin directory, typically:
      `C:\Program Files\PostgreSQL\16\bin`
   f. Click 'OK' to close all dialogs.
   g. Restart any open command prompts or Git Bash windows for the changes to take effect.
3. Ensure that `update_db.sh` and `schema.sql` are in your project directory.
4. Run the script in VS Code:
    a. Open a new terminal in VS Code.
    b. Switch from PowerShell to Git Bash using the dropdown in the terminal.
    c. Type `./update_db.sh` and press Enter.

Note: If you encounter any issues running the script, make sure it's executable by running `chmod +x update_db.sh` in Git Bash before trying to execute it.

To run:

1. in vs code terminal, type npm run start:full
2. in command prompt, type ngrok http 5000
3. Cick on the web interface link
4. Copy the URL on the webpage
5. Paste url in clerk dashboard webhook endpoint (make sure "/webhooks/clerk" is at the end)
6. In vs code go to .env.localhost
7. Replace the url beside NEXT_PUBLIC_API_URL= with your new one
8. Cick the link on the ngrok webpage which will send you to our webpage

To update db:

1. Open a new vs code terminal
2. Click the drop down beside the plus icon on the top right of the terminal 
3. Select Git Bash
4. Type "cd backend/database"
5. Now type "./update_db.sh"
