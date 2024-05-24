# Cleaning Tools App

A comprehensive quoting tool designed specifically for cleaning service providers, enabling the creation, management, and tracking of quotes with ease. It supports integration with various CRM systems for efficient data handling and offers a user-friendly interface for managing clients, services, and quotes.

## Overview

The application is built on a robust stack that includes Node.js for the backend, Express for web server routing, MongoDB as the database, and EJS for templating. It incorporates essential functionality such as user authentication, session management, and dynamic content rendering. The project structure is organized into models for database schemas, routes for handling HTTP requests, views for the frontend, and utilities for additional functionalities like email sending and price calculation.

## Features

- **Client Management:** Users can create, update, and delete client profiles within the app.
- **Quote Generation:** Enables the creation of detailed and customized quotes based on specific client needs and service requirements.
- **Dashboard:** Provides a comprehensive overview of all quotes created, with the ability to track their status (sent, opened, clicked).
- **CRM Integration:** Facilitates data exchange with CRM platforms for streamlined operations.
- **Email Notifications:** Sends automated email notifications for quotes and allows tracking of opens and clicks.

## Getting Started

### Requirements
- Node.js installed on your system
- MongoDB setup for data storage
- An SMTP server or email service for sending notifications

### Quickstart
1. Clone the repository to your local machine.
2. Copy the `.env.example` file to `.env` and update it with your MongoDB URL and SMTP server details.
3. Install the required dependencies with `npm install`.
4. Start the application using `npm start`. It will run on the port specified in your `.env` file.

### License

Copyright (c) 2024.