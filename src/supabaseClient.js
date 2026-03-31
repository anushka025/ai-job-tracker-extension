import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mkraicrlcwvqaycqlnxg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcmFpY3JsY3d2cWF5Y3FsbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mjg1NjEsImV4cCI6MjA4NjAwNDU2MX0.mbsdXNQwcXA641SKeni2rO0NHfzeWtgqOuGfZV5CKoc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)