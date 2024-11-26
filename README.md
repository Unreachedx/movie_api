# Movie App API Documentation

## Overview
Welcome to the Movie App API! This API allows you to manage users and access detailed information about movies. Authentication is required to interact with the endpoints. Please ensure you are logged in before using the API.

---

## Base URL
```
https://myflixapplication-paddy-fac687c8aed3.herokuapp.com
```

---

## Endpoints
The API provides the following endpoints:

### Users Endpoints

| Endpoint                               | Method | Description                                  |
|----------------------------------------|--------|----------------------------------------------|
| `/users`                               | POST   | Create a new user                            |
| `/users`                               | GET    | Retrieve a list of all users                |
| `/users/:Username`                     | GET    | Retrieve a user by username                 |
| `/users/:Username`                     | PUT    | Update an existing user by username         |
| `/users/:Username`                     | DELETE | Delete a user by username                   |
| `/users/:Username/favorites/:movieID`  | POST   | Add a movie to a user's list of favorites   |
| `/users/:Username/favorites/:movieID`  | DELETE | Remove a movie from a user's list of favorites |

#### Create User
**POST** `/users`

**Request Body:**
```json
{
  "Username": "johndoe",
  "Password": "password123",
  "Email": "johndoe@example.com",
  "Birthday": "1990-01-01"
}
```

#### Update User
**PUT** `/users/:Username`

**Request Body:**
```json
{
  "Username": "newusername",
  "Password": "newpassword123",
  "Email": "newemail@example.com",
  "Birthday": "1991-02-02"
}
```

---

### Movies Endpoints

| Endpoint                     | Method | Description                      |
|------------------------------|--------|----------------------------------|
| `/movies`                    | GET    | Retrieve a list of all movies    |
| `/movies/:movieID`           | GET    | Retrieve a movie by its ID       |
| `/movies/:title`             | GET    | Retrieve a movie by its title    |
| `/movies/genre/:genre`       | GET    | Retrieve movies by genre         |
| `/directors/:directorName`   | GET    | Retrieve movies by director name |

#### List All Movies
**GET** `/movies`

Retrieve a complete list of all movies.

#### Get Movie by Title
**GET** `/movies/:title`

Retrieve details of a movie by its title.

#### Get Movies by Genre
**GET** `/movies/genre/:genre`

Retrieve movies filtered by a specific genre.

#### Get Movies by Director
**GET** `/directors/:directorName`

Retrieve movies directed by a specific director.

---

## Authentication
Authentication is required to access the API endpoints. Ensure you have valid credentials to interact with the API.

---

## Example Request
**POST** `/users`

**Request Body:**
```json
{
  "Username": "johndoe",
  "Password": "password123",
  "Email": "johndoe@example.com",
  "Birthday": "1990-01-01"
}
```

**Response:**
```json
{
  "message": "User created successfully!"
}
```

