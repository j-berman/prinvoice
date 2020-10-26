export const CREATE_RESOURCE_TABLE = `
  CREATE TABLE resource (
    uuid              PRIMARY KEY,
    name              TEXT NOT NULL,  
    unit_price        REAL,
    created_date      TEXT NOT NULL,
    UNIQUE (name COLLATE NOCASE)
  );
`
