DROP TABLE IF EXISTS users;
CREATE TABLE users
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    password TEXT NOT NULL,
    score INTEGER,
    difficulty TEXT
);


DROP TABLE IF EXISTS scores;
CREATE TABLE scores
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    difficulty TEXT NOT NULL
);

