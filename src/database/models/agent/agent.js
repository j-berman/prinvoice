export const CREATE_AGENT_TABLE = `
  CREATE TABLE agent (
    uuid            PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT,
    created_date    TEXT NOT NULL,
    UNIQUE (name COLLATE NOCASE)
  );
`
