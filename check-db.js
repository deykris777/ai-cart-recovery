require('dotenv').config();
const { supabase } = require('./src/db/supabaseClient');

async function checkDatabase() {
  console.log('Checking Supabase for abandoned carts...');
  const { data, error } = await supabase.from('abandoned_carts').select('*');
  
  if (error) {
    console.error('Error fetching from Supabase:', error.message);
  } else {
    console.log(`Found ${data.length} carts in the database!`);
    if (data.length > 0) {
      console.log('Latest cart details:');
      console.log(JSON.stringify(data[data.length - 1], null, 2));
    }
  }
}

checkDatabase();
