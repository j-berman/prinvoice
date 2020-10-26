import { CREATE_RESOURCE_TABLE } from './models/resource/resource'
import { CREATE_AGENT_TABLE } from './models/agent/agent'
import { CREATE_INVOICE_TABLE } from './models/event/invoice'
import { CREATE_INVOICE_ITEM_TABLE } from './models/event/invoiceItem'
import { CREATE_USER_TABLE } from './models/agent/user'
import { APP_NAME, USERBASE_DATABASE_NAME } from '../config'
import { readFile, flatten } from '../utils'
import { getBindValuePlaceholders } from './utils'

const CURRENT_VERSION = 1

const CREATE_VERSION_TABLE = `
  CREATE TABLE version (
    _v          PRIMARY KEY NOT NULL,
    app_name    TEXT NOT NULL
  );
`

const SELECT_VERSION = `
  SELECT _v
  FROM version;
`

const INSERT_VERSION =  `
  INSERT INTO version (_v, app_name)
  VALUES ($_v, $app_name);
`

const VERSION_1_MIGRATION = [
  { sql: CREATE_VERSION_TABLE },
  { sql: INSERT_VERSION, bindValues: { '$_v': 1, '$app_name': APP_NAME } },
  { sql: CREATE_RESOURCE_TABLE },
  { sql: CREATE_AGENT_TABLE },
  { sql: CREATE_INVOICE_TABLE },
  { sql: CREATE_INVOICE_ITEM_TABLE },
  { sql: CREATE_USER_TABLE },
]

// overwrite payee_uuid with userId, and payor_uuid with agent stored with provided name
const _upsertInvoices = (sqlJsDb, userId) => {
  const table = sqlJsDb.exec(`SELECT * FROM invoice;`)
  const { columns, values } = table[0]

  let payeeUuidIndex, payorUuidIndex, payorNameIndex = -1
  for (let i = 0 ; i < columns.length; i++) {
    const column = columns[i]
    if (column === 'payee_uuid') payeeUuidIndex = i
    else if (column === 'payor_uuid') payorUuidIndex = i
    else if (column === 'payor_name') payorNameIndex = i

    if (payeeUuidIndex >= 0 && payorUuidIndex >= 0 && payorNameIndex >= 0) break
  }

  const bindValuePlaceHolders = []

  for (let i = 0; i < values.length; i++) {
    // overwrite payee_uuid with userId
    values[i][payeeUuidIndex] = userId

    // ovewrite payor_uuid with uuid of agent stored with the provided payor_name
    const payorUuid = `
      SELECT uuid
      FROM agent
      WHERE name = ? COLLATE NOCASE
    `
    const singleRowBindValuePlaceholders = []
    singleRowBindValuePlaceholders.length = columns.length
    singleRowBindValuePlaceholders.fill('?')
    singleRowBindValuePlaceholders[payorUuidIndex] = `(${payorUuid})`
    bindValuePlaceHolders.push(`(${singleRowBindValuePlaceholders})`)

    // ? in query above will be replaced with payorName
    const payorName = values[i][payorNameIndex]
    values[i][payorUuidIndex] = payorName
  }

  return {
    sql: `
      INSERT INTO invoice (${columns})
      VALUES ${bindValuePlaceHolders}
      ON CONFLICT DO NOTHING;
    `,
    bindValues: flatten(values)
  }
}

// overwrite resource_uuid with resource stored with provided name
const _upsertInvoiceItems = (sqlJsDb) => {
  const table = sqlJsDb.exec(`SELECT * FROM invoice_item;`)
  const { columns, values } = table[0]

  let resourceUuidIndex, itemNameIndex = -1
  for (let i = 0 ; i < columns.length; i++) {
    const column = columns[i]
    if (column === 'resource_uuid') resourceUuidIndex = i
    else if (column === 'item_name') itemNameIndex = i

    if (resourceUuidIndex >= 0 && itemNameIndex >= 0) break
  }

  const bindValuePlaceHolders = []

  for (let i = 0; i < values.length; i++) {
    // ovewrite resource_uuid with uuid of resource stored with the provided item_name
    const resourceUuid = `
      SELECT uuid
      FROM resource
      WHERE name = ? COLLATE NOCASE
    `
    const singleRowBindValuePlaceholders = []
    singleRowBindValuePlaceholders.length = columns.length
    singleRowBindValuePlaceholders.fill('?')
    singleRowBindValuePlaceholders[resourceUuidIndex] = `(${resourceUuid})`
    bindValuePlaceHolders.push(`(${singleRowBindValuePlaceholders})`)

    // ? in query above will be replaced with resourceName
    const resourceName = values[i][itemNameIndex]
    values[i][resourceUuidIndex] = resourceName
  }

  return {
    sql: `
      INSERT INTO invoice_item (${columns})
      VALUES ${bindValuePlaceHolders}
      ON CONFLICT DO NOTHING;
    `,
    bindValues: flatten(values)
  }
}

const _upsert = (sqlJsDb, tableName) => {
  const table = sqlJsDb.exec(`SELECT * FROM ${tableName};`)
  const { columns, values } = table[0]

  return {
    sql: `
      INSERT INTO ${tableName} (${columns})
      VALUES ${getBindValuePlaceholders(columns, values)}
      ON CONFLICT DO NOTHING;
    `,
    bindValues: flatten(values)
  }
}

export const init = async (onChange) => {
  let version
  const changeHandler = ({ db }) => {
    if (!version) {
      try {
        version = db.exec(SELECT_VERSION)[0].values[0][0]
      } catch {
        version = 0
      }
    }

    // no more migrations to run
    if (version === CURRENT_VERSION) onChange({ db })
  }

  await window.userbase.openSqlJsDatabase({ databaseName: USERBASE_DATABASE_NAME, changeHandler })

  // run migrations to initalize to current version
  let migration
  switch (version) {
    case 1:
      // no need to do anything, already initialized
      break
    case 0:
    default:
      migration = VERSION_1_MIGRATION
  }

  if (migration) await window.userbase.execSql({ databaseName: USERBASE_DATABASE_NAME, sqlStatements: migration })

  version = CURRENT_VERSION
}

export const restoreFromBackupFile = async (backupFile, userId) => {
  let version, sqlJsDb
  try {
    const data = new Uint8Array(await readFile(backupFile))
    sqlJsDb = new window.sqlJs.Database(data)
    version = sqlJsDb.exec(SELECT_VERSION)[0].values[0][0]
  } catch (e) {
    console.warn(e)
    throw new Error('Invalid backup file.')
  }

  if (version !== 1) throw new Error('Incompatible version of Prinvoice.\n\nPlease use the latest version of Prinvoice to restore this backup.')

  await window.userbase.execSql({
    databaseName: USERBASE_DATABASE_NAME,
    sqlStatements: [
      _upsert(sqlJsDb, 'resource'),
      _upsert(sqlJsDb, 'agent'),
      _upsertInvoices(sqlJsDb, userId),
      _upsertInvoiceItems(sqlJsDb),
    ]
  })
}