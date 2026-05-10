// Shared Docker configuration for code execution
const DOCKER_IMAGES = {
  python: 'python:3.10-alpine',
  javascript: 'node:18-alpine',
  java: 'eclipse-temurin:17-alpine',
  cpp: 'gcc:12'
};

module.exports = { DOCKER_IMAGES };
