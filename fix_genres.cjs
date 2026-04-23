const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('/tmp/cifras/.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL="([^"]+)"/);
const keyMatch = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/);
const supabaseUrl = urlMatch ? urlMatch[1] : 'https://duqzvstpszcaxizgmafj.supabase.co';
// Usa anon key para query public, ok, pois estamos alterando data
// Para update, preciso da service role
