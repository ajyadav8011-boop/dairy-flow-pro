import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btyjlcwmsgarotuccbih.supabase.co'
const supabaseAnonKey = 'sb_publishable_Pw91wFShhrv1S5Rr3O0q8Q_PKGNnCHb'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)