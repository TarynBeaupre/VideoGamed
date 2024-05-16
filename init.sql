DROP DATABASE IF EXISTS "VideoGamedDB";
CREATE DATABASE "VideoGamedDB";

\c VideoGamedDB;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(100) DEFAULT 'Guest',
    pfp VARCHAR(300) DEFAULT 'https://i.pinimg.com/564x/af/0a/0a/af0a0af3734b37b50e7f48eacb3b09a6.jpg',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS games;
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cover VARCHAR(300),
    developer VARCHAR(100) NOT NULL,
    release_year SMALLINT NOT NULL,
    total_stars INTEGER DEFAULT 0
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    stars INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    review TEXT NOT NULL,
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

--Games--
--INSERT INTO games(title, description, cover, developer, release_year, total_stars)
--VALUES ('title',
--'desc',
--'cover', 'dev','year', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Minecraft',
'Minecraft is a sandbox video game that allows players to explore, create, and survive in a procedurally generated world made up of blocks. ',
'https://upload.wikimedia.org/wikinews/en/7/7a/Minecraft_game_cover.jpeg', 'Mojang', '2011', 50);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Stardew Valley',
'Stardew Valley is a charming farming game where players restore a neglected farm and explore various activities like crop cultivation, animal husbandry, mining, and building relationships with villagers.',
'https://cdn2.steamgriddb.com/thumb/06be9898d168ca5d538a2f3502991152.jpg', 'ConcernedApe','2016', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('The Legend of Zelda: Breath of the Wild',
'et at the end of the Zelda timeline, the player controls an amnesiac Link as he sets out to save Princess Zelda and prevent Calamity Ganon from destroying the world. Players explore the open world of Hyrule while they collect items and complete objectives such as puzzles or side quests. Breath of the Wild''s world is unstructured and encourages exploration and experimentation; the story can be completed in a nonlinear fashion. ',
'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg', 'Nintendo','2017', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Super Mario Galaxy',
'Super Mario Galaxy[b] is a 2007 platform game developed and published by Nintendo for the Wii. It is the third 3D game in the Super Mario series. As Mario, the player embarks on a quest to rescue Princess Peach, save the universe from Bowser, and collect 120 Power Stars, after which the player can play the game as Luigi for a more difficult experience.',
'https://upload.wikimedia.org/wikipedia/en/7/76/SuperMarioGalaxy.jpg', 'Nintendo','2007', 50);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Portal 2',
'Like the original Portal (2007), players solve puzzles by placing portals and teleporting between them. Portal 2 adds features including tractor beams, lasers, light bridges, and paint-like gels that alter player movement or allow portals to be placed on any surface.',
'https://upload.wikimedia.org/wikipedia/en/f/f9/Portal2cover.jpg', 'Valve','2011', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('The Legend of Zelda: A Link to the Past',
'The story is set many years before the events of the first two Zelda games. The player assumes the role of Link as he journeys to save Hyrule, defeat the demon king Ganon, and rescue the descendants of the Seven Sages.',
'https://m.media-amazon.com/images/M/MV5BMWNmNjlmZjEtN2EzYi00ZDQyLTg0YzQtMzNmZGE3MjVlZjE0XkEyXkFqcGdeQXVyMTgwNDM0Nzc0._V1_.jpg', 'Nintendo','1991', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Red Dead Redemption 2',
'Red Dead Redemption 2 is a Western-themed action-adventure game. Played from a first- or third-person perspective, the game is set in an open-world environment featuring a fictionalized version of the United States in 1899.',
'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg', 'Rockstar Games','2019', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Half-Life 2',
'Like the original Half-Life (1998), Half-Life 2 is a single-player first-person shooter (FPS) in which players control Gordon Freeman. It has similar mechanics to Half-Life, including health-and-weapon systems (though with fewer overall weapons) and periodic physics puzzles, except with the newer Source engine and improved graphics.',
'https://upload.wikimedia.org/wikipedia/en/2/25/Half-Life_2_cover.jpg', 'Valve','2004', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Grand Theft Auto V',
'Grand Theft Auto V is a 2013 action-adventure game developed by Rockstar North and published by Rockstar Games.  Players control the protagonists throughout single-player and switch among them, both during and outside missions. The story is centred on the heist sequences, and many missions involve shooting and driving gameplay.',
'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png', 'Rockstar Games','2013', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('The Witcher 3: Wild Hunt',
'The game takes place in a fictional fantasy world based on Slavic mythology. Players control Geralt of Rivia, a monster slayer for hire known as a Witcher, and search for his adopted daughter, who is on the run from the otherworldly Wild Hunt. ',
'https://upload.wikimedia.org/wikipedia/en/0/0c/Witcher_3_cover_art.jpg', 'CD Projekt Red','2015', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('The Last of Us',
'Players control Joel, a smuggler tasked with escorting a teenage girl, Ellie, across a post-apocalyptic United States. The Last of Us is played from a third-person perspective. Players use firearms and improvised weapons and can use stealth to defend against hostile humans and cannibalistic creatures infected by a mutated fungus.',
'https://upload.wikimedia.org/wikipedia/en/4/46/Video_Game_Cover_-_The_Last_of_Us.jpg', 'Naughty Dog','2013', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Undertale',
'Undertale is a role-playing game that uses a top-down perspective.[3] In the game, the player controls a child and completes objectives in order to progress through the story.[4] Players explore an underground world filled with towns and caves, and are required to solve numerous puzzles on their journey.',
'https://m.media-amazon.com/images/M/MV5BNzkwZDliNGEtMDNkNi00ODcxLWI1N2UtNDE1NmZlM2QyMTY4XkEyXkFqcGdeQXVyMTA0MTM5NjI2._V1_.jpg', 'Toby Fox','2015', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('God of War',
'Unlike previous games, which were loosely based on Greek mythology, this installment is loosely inspired by Norse mythology, with the majority of it set in ancient Scandinavia in the realm of Midgard. For the first time in the series, there are two protagonists: Kratos, the former Greek God of War who remains the only playable character, and his young son, Atreus.',
'https://upload.wikimedia.org/wikipedia/en/a/a7/God_of_War_4_cover.jpg', 'Santa Monica Studio','2018', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Doom: Eternal',
'Set some time after the events of the 2016 game, the story follows the Doom Slayer once again, on a mission to end Hell''s consumption of Earth and foil the alien Maykrs'' plans to exterminate humanity.',
'https://upload.wikimedia.org/wikipedia/en/9/9d/Cover_Art_of_Doom_Eternal.png', 'id Software','2020', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Apex Legends',
'Before the match, players form into two- or three-player squads, and select from pre-designed characters with distinctive abilities, known as "Legends". The game has two gameplay modes. In "Battle Royale", up to 20 three-person squads or 30 two-person duos land on an island and search for weapons and supplies before attempting to defeat all other players in combat.',
'https://upload.wikimedia.org/wikipedia/en/d/db/Apex_legends_cover.jpg', 'Respawn Entertainment','2019', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Destiny 2',
'Set in a "mythic science fiction" world, the game features a multiplayer "shared-world" environment with elements of role-playing games. Like the original, activities in Destiny 2 are divided among player versus environment (PvE) and player versus player (PvP) game types. ',
'https://upload.wikimedia.org/wikipedia/en/0/05/Destiny_2_%28artwork%29.jpg', 'Bungie','2017', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('Hollow Knight',
'Hollow Knight is a 2017 Metroidvania video game developed and published by independent developer Team Cherry. The player controls the Knight, an insectoid warrior exploring Hallownest, a fallen kingdom plagued by a supernatural disease. ',
'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Hollow_Knight_first_cover_art.webp/274px-Hollow_Knight_first_cover_art.webp.png', 'Team Cherry','2017', 40);

INSERT INTO games(title, description, cover, developer, release_year, total_stars)
VALUES ('The Witness',
'The Witness is a 2016 puzzle video game developed and published by Thekla, Inc.[b] Inspired by Myst, the game involves the exploration of an open world island filled with natural and man-made structures. The player progresses by solving puzzles, which are based on interactions with grids presented on panels around the island or paths hidden within the environment.',
'https://upload.wikimedia.org/wikipedia/en/f/f4/The_Witness_cover.jpg', 'Thelka, Inc.','2016', 40);

--Fake users--
INSERT INTO users(email, username, pfp, password)
VALUES('chippichippi@email.com', 'Chippi','https://images.ctfassets.net/ub3bwfd53mwy/5WFv6lEUb1e6kWeP06CLXr/acd328417f24786af98b1750d90813de/4_Image.jpg?w=750', 'chippi123' );
INSERT INTO users(email, username, pfp, password)
VALUES('chappachappa@email.com', 'Chappa','https://preview.redd.it/19winbuo94t91.jpg?width=640&crop=smart&auto=webp&s=fadacc562b636622cc7851d107352d7ac1584681', 'chappa123');

-- Reviews--

INSERT INTO reviews(title, stars, likes, review, user_id, reviewed_game_id)
VALUES ('peak', 5, 23, 'Im going to make you MINE... CRAFT... ahaa', 1, 1);

INSERT INTO reviews(title, stars, likes, review, user_id, reviewed_game_id)
VALUES ('yes',5, 5, '1.6 update is great!', 2, 2);
INSERT INTO reviews(title, stars, likes, review, user_id, reviewed_game_id)
VALUES ('decent', 5, 10, 'All my homies hate Pierre.', 1, 2);

INSERT INTO tag(description) VALUES('Action');
INSERT INTO tag(description) VALUES('Adventure');
INSERT INTO tag(description) VALUES('Puzzle');
INSERT INTO tag(description) VALUES('FPS');
INSERT INTO tag(description) VALUES('Multiplayer');
INSERT INTO tag(description) VALUES('Single-player');
INSERT INTO tag(description) VALUES('Open World');
INSERT INTO tag(description) VALUES('Horror');
INSERT INTO tag(description) VALUES('Cozy');
INSERT INTO tag(description) VALUES('RPG');
INSERT INTO tag(description) VALUES('Indie');
INSERT INTO tag(description) VALUES('Strategy');
INSERT INTO tag(description) VALUES('Sports');
INSERT INTO tag(description) VALUES('Sandbox');
INSERT INTO tag(description) VALUES('Platformer');
INSERT INTO tag(description) VALUES('2D');
INSERT INTO tag(description) VALUES('3D');
INSERT INTO tag(description) VALUES('VR');
INSERT INTO tag(description) VALUES('Simulation');
INSERT INTO tag(description) VALUES('MMO');
INSERT INTO tag(description) VALUES('Windows');
INSERT INTO tag(description) VALUES('MacOS');
INSERT INTO tag(description) VALUES('Mobile');

INSERT INTO gametag()




