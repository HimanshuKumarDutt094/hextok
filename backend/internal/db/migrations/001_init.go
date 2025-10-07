package migrations

const CreateUserTable = `
CREATE TABLE IF NOT EXISTS users
(
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
userName TEXT NOT NULL,
createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
`
const CreateHexTable = `
CREATE TABLE IF NOT EXISTS hex (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
hexValue TEXT UNIQUE
)
`
const CreateSessionTable = `
CREATE TABLE IF NOT EXISTS session (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
userId BIGINT REFERENCES users(id) ON DELETE CASCADE, 
secretHash TEXT,
createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
lastVerifiedAt TIMESTAMP NOT NULL
);
`

const CreateOauthTable = `
CREATE TABLE IF NOT EXISTS oauth (
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
userId BIGINT REFERENCES users(id) ON DELETE CASCADE,
provider TEXT,
providerUserId TEXT UNIQUE,
accessToken TEXT,
refreshToken TEXT,
createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

`

const CreateLikedJoinTable = `
CREATE TABLE IF NOT EXISTS liked (
 userId BIGINT REFERENCES users(id) ON DELETE CASCADE,
 hexId BIGINT REFERENCES hex(id) ON DELETE CASCADE,
createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
PRIMARY KEY (userId,hexId)

);
`

const CreateFollowedJoinTable = `
CREATE TABLE IF NOT EXISTS followed (
followerId BIGINT  REFERENCES users(id) ON DELETE CASCADE,
followingId BIGINT REFERENCES users(id) ON DELETE CASCADE,
createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
PRIMARY KEY (followerId,followingId)
);
`
const TruncateAll = `TRUNCATE TABLE users, oauth, liked, session, followed, hex CASCADE;
`
const DropAll = `DROP TABLE IF EXISTS liked, followed, session, oauth, hex, users CASCADE;
`
