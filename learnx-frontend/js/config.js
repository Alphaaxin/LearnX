// LearnX Configuration

// Use the machine's IP address to make the app accessible from other devices
const SERVER_HOST = '192.168.0.127';
const SERVER_PORT = 5000;

// Base URL for API calls
const API_BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}/api`;

// Base URL for server (for images and other assets)
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

// Export configuration
window.CONFIG = {
  API_BASE_URL,
  SERVER_URL,
  SERVER_HOST,
  SERVER_PORT
}; 