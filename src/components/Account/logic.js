import {
  USERBASE_DATABASE_NAME
} from '../../config'

export const updateDefaultCurrency = async (userId, currency) => {
  const sql = `
    INSERT INTO user (uuid, currency, created_date)
    VALUES ($uuid, $currency, $created_date)
    ON CONFLICT(uuid) DO UPDATE SET currency=excluded.currency;
  `

  const bindValues = {
    $uuid: userId,
    $currency: currency,
    $created_date: new Date().toISOString()
  }

  await window.userbase.execSql({ databaseName: USERBASE_DATABASE_NAME, sql, bindValues })
}