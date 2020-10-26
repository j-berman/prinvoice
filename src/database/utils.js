export const setCreatedDateOnSqlStatements = (sqlStatements) => {
  const createdDate = new Date().toISOString()
  return sqlStatements.map((sqlStatement) => {
    const { sql, bindValues } = sqlStatement
    return {
      sql,
      bindValues: {
        ...bindValues,
        $created_date: createdDate
      }
    }
  })
}

export const getSqlRows = (sqlJsDb, sql) => {
  const rows = []

  const stmt = sqlJsDb.prepare(sql)
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }

  stmt.free()
  return rows
}

// if 3 columns and 2 rows, returns string: "(?, ?, ?),(?, ?, ?)"
export const getBindValuePlaceholders = (columns, rows) => {
  const singleBindValues = []
  singleBindValues.length = columns.length
  const singleBindValuesString = `(${singleBindValues.fill('?')})`

  const allBindValues = []
  allBindValues.length = rows.length
  return allBindValues.fill(singleBindValuesString).toString()
}
