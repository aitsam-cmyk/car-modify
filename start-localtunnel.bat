@echo off
REM Start your server first: npm start
REM Then run this script to expose port 3000 via localtunnel.
REM Edit SUBDOMAIN below if you want a custom subdomain.

set SUBDOMAIN=cargarage-demo
echo Starting localtunnel on port 3000...
npx localtunnel --port 3000 --subdomain %SUBDOMAIN% || npx localtunnel --port 3000
pause
