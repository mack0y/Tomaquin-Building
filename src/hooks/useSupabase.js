import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select(options.select || '*')

      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? false })
      }

      if (options.filters) {
        for (const filter of options.filters) {
          if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            query = query.eq(filter.column, filter.value)
          }
        }
      }

      const { data: result, error: err } = await query

      if (err) throw err
      setData(result || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(options)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useSupabaseMutation(table) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const insert = async (records) => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase.from(table).insert(records).select()
      if (err) throw err
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const update = async (id, updates) => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase.from(table).update(updates).eq('id', id).select()
      if (err) throw err
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id) => {
    try {
      setLoading(true)
      setError(null)
      const { error: err } = await supabase.from(table).delete().eq('id', id)
      if (err) throw err
      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  return { insert, update, remove, loading, error }
}
