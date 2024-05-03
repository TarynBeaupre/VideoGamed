DROP DATABASE IF EXISTS "VideoGamedDB";
CREATE DATABASE "VideoGamedDB";

\c VideoGamedDB;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    pfp VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS games;
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cover VARCHAR(100),
    developer VARCHAR(100) NOT NULL,
    released_at TIMESTAMP NOT NULL,
    total_stars INTEGER DEFAULT 0
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    stars INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    reviewed_game_id INTEGER REFERENCES games(id) ON DELETE CASCADE

);

DROP TABLE IF EXISTS played_games;
CREATE TABLE played_games (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    played_game_id INTEGER REFERENCES games(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS wishlist_games;
CREATE TABLE wishlist_games (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    wishlisted_game_id INTEGER REFERENCES games(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS gametag;
CREATE TABLE gametag (
    tag_id INTEGER REFERENCES tag(id) ON DELETE CASCADE
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS tag;
CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    description VARCHAR(100) NOT NULL
);


INSERT INTO games(title, description, cover, developer, released_at, total_stars)
VALUES ("Minecraft", "images/covers/minecraft.png", "Mojang", 2011-11-18, 50)
