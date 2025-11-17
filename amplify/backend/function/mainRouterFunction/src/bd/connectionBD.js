require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
console.log('🔌 [connectionBD] Inicializando cliente Supabase...');
console.log('🌐 SUPABASE_URL:', process.env.SUPABASE_URL);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        db: {
            schema: 'diarioDeClasseDB'
        }
    }
);
console.log('✅ [connectionBD] Cliente Supabase criado com sucesso (no schema diarioDeClasseDB).');

module.exports = { supabase };