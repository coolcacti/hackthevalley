# Express MongoDB User App

This project is a simple Express application that uses MongoDB to store user information. It allows for the management of user data, including compost, recycle, trash, and total items collected.

## Project Structure

```
express-mongo-user-app
├── src
│   ├── app.js               # Entry point of the application
│   ├── models
│   │   └── user.js          # Mongoose model for user information
│   ├── routes
│   │   └── user.js          # User-related routes
│   └── controllers
│       └── userController.js # Logic for user-related operations
├── package.json              # NPM configuration file
├── .env                      # Environment variables
└── README.md                 # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd express-mongo-user-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your MongoDB connection string and Auth0 credentials:
   ```
   MONGODB_URI=<your_mongodb_connection_string>
   AUTH0_DOMAIN=<your_auth0_domain>
   AUTH0_CLIENT_ID=<your_auth0_client_id>
   AUTH0_CLIENT_SECRET=<your_auth0_client_secret>
   ```

## Usage

1. Start the application:
   ```
   npm start
   ```

2. The server will run on `http://localhost:3000`.

## API Endpoints

- **POST /users**: Create a new user
- **GET /users/:id**: Retrieve user information by ID
- **PUT /users/:id**: Update user information by ID
- **DELETE /users/:id**: Delete user by ID

## License

This project is licensed under the MIT License.