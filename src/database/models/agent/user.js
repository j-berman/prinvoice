export const CREATE_USER_TABLE = `
  CREATE TABLE user (
    uuid               PRIMARY KEY NOT NULL,
    name               TEXT,
    currency           TEXT,
    created_date       TEXT NOT NULL
  );
`
