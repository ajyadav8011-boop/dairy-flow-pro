import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://btyjlcwmsgarotuccbih.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Pw91wFShhrv1S5Rr3O0q8Q_PKGNnCHb'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)