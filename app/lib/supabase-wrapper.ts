import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_KEY in your .env file.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Fetch a single row from a case-sensitive table name.
 * @param tableName Exact table name, e.g. 'public.User'
 * @param filters Array of [column, operator, value]
 * @param strict If true, throws on missing row
 */
export async function fetchSingle<T>(
  tableName: string,
  filters: [string, string, any][],
  strict = true
): Promise<T | null> {
  // ? Debug diagnostics
  console.log('? Supabase wrapper diagnostics:')
  console.log('  Table name:', tableName)
  console.log('  Filters:', filters)
  console.log('  Supabase URL:', supabaseUrl)
  console.log('  Supabase Key:', supabaseKey ? '[REDACTED]' : '[MISSING]')

  if (tableName.includes('public.public')) {
    console.warn('?? Table name appears double-prefixed. Check input to fetchSingle().')
  }

  let query = supabase.from<T>(tableName).select('*')

  for (const [column, operator, value] of filters) {
    switch (operator) {
      case 'eq':
        query = query.eq(column, value)
        break
      case 'neq':
        query = query.neq(column, value)
        break
      case 'gt':
        query = query.gt(column, value)
        break
      case 'lt':
        query = query.lt(column, value)
        break
      case 'gte':
        query = query.gte(column, value)
        break
      case 'lte':
        query = query.lte(column, value)
        break
      case 'like':
        query = query.like(column, value)
        break
      case 'ilike':
        query = query.ilike(column, value)
        break
      case 'is':
        query = query.is(column, value)
        break
      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error(`? Supabase error [${tableName}]:`, error)
    return null
  }

  if (!data && strict) {
    throw new Error(`No row found in ${tableName} with filters: ${JSON.stringify(filters)}`)
  }

  return data ?? null
}
