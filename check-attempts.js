require('dotenv').config();
const { supabase } = require('./src/db/supabaseClient');

async function checkAttempts() {
  console.log('Fetching recovery attempts...');
  const { data, error } = await supabase.from('recovery_attempts').select('*, abandoned_carts(*)');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data.slice(-3), null, 2));
  }
}
checkAttempts();
