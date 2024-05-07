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
    release_year SMALLINT NOT NULL,
    total_stars INTEGER DEFAULT 0
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    stars INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reviewed_game_id INTEGER REFERENCES games(id) ON DELETE CASCADE

);

DROP TABLE IF EXISTS played_games;
CREATE TABLE played_games (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    played_game_id INTEGER REFERENCES games(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS wishlist_games;
CREATE TABLE wishlist_games (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    wishlisted_game_id INTEGER REFERENCES games(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS tag;
CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    description VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS gametag;
CREATE TABLE gametag (
    tag_id INTEGER REFERENCES tag(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE
);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Minecraft','Minecraft is a sandbox video game that allows players to explore, create, and survive in a procedurally generated world made up of blocks. ', 'https://upload.wikimedia.org/wikinews/en/7/7a/Minecraft_game_cover.jpeg', 'Mojang', '2011', 50);
INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Stardew Valley','Stardew Valley is a charming farming game where players restore a neglected farm and explore various activities like crop cultivation, animal husbandry, mining, and building relationships with villagers.', 'https://cdn2.steamgriddb.com/thumb/06be9898d168ca5d538a2f3502991152.jpg', 'ConcernedApe', '2016', 40);