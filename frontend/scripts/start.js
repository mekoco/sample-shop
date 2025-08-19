#!/usr/bin/env node

const { spawn } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Set PORT from FRONTEND_PORT
process.env.PORT = process.env.FRONTEND_PORT || '3000';

// Ensure React app env vars are set with proper values
process.env.REACT_APP_API_HOST = process.env.REACT_APP_API_HOST || 'localhost';
process.env.REACT_APP_API_PORT = process.env.REACT_APP_API_PORT || '11000';

// Build the API URL using the resolved host and port values
const apiHost = process.env.REACT_APP_API_HOST || 'localhost';
const apiPort = process.env.REACT_APP_API_PORT || '11000';
process.env.REACT_APP_API_URL = `http://${apiHost}:${apiPort}/api`;

// Run react-scripts start
const child = spawn('npx', ['react-scripts', 'start'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});