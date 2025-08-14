import 'dotenv/config'
import { fetchSingle } from '../lib/supabase-wrapper'

type User = {
  id: string
  email: string
}

(async () => {
  console.log('? Running Supabase test...')

  const user = await fetchSingle<User>('User', [['email', 'eq', 'test@example.com']], false)
  if (!user) {
    console.log('No user found.')
  } else {
    console.log('? User found:', user)
  }
})()
