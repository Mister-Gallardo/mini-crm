import { notFound } from '@tanstack/react-router'
import { isMissingRowError } from '@/lib/errors'

export async function ensureFound<T>(promise: Promise<T>) {
  try {
    return await promise
  } catch (error) {
    if (isMissingRowError(error)) {
      throw notFound()
    }

    throw error
  }
}
