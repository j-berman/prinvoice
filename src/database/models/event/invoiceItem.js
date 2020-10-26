export const CREATE_INVOICE_ITEM_TABLE = `
  CREATE TABLE invoice_item (
    invoice_uuid    TEXT NOT NULL,
    item_number     INTEGER NOT NULL,
    item_name       TEXT NOT NULL,
    resource_uuid   REAL NOT NULL,
    quantity        REAL NOT NULL,
    unit_price      REAL NOT NULL,
    created_date    TEXT NOT NULL,
    PRIMARY KEY(invoice_uuid, item_number),
    FOREIGN KEY(invoice_uuid) REFERENCES invoice(uuid),
    FOREIGN KEY(resource_uuid) REFERENCES resource(uuid)
  );
`
