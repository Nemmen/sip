#!/bin/bash
# Render deployment script for API service
node --require tsconfig-paths/register apps/api-service/dist/apps/api-service/src/main.js
