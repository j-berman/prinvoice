export const CREATE_INVOICE_TABLE = `
  CREATE TABLE invoice (
    uuid            PRIMARY KEY NOT NULL,
    date_issued     TEXT NOT NULL,
    date_due        TEXT,
    date_paid       TEXT,
    currency        TEXT,
    discount        REAL,
    tax_percent     REAL,
    shipping        REAL,
    note            TEXT,

    payee_uuid      TEXT,
    payee_name      TEXT,
    payee_email     TEXT,

    payor_uuid      TEXT,
    payor_name      TEXT,
    payor_email     TEXT,

    created_date    TEXT NOT NULL,
    FOREIGN KEY(payor_uuid) REFERENCES agent(uuid)
  );
`
