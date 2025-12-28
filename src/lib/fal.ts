/// <reference types="vite/client" />
import { fal } from '@fal-ai/client'

// Configure FAL client with API key from environment
const apiKey = import.meta.env.VITE_FAL_KEY as string | undefined

if (apiKey) {
  fal.config({
    credentials: apiKey,
  })
}

export { fal }
