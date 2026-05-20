require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabase } = require('./src/db/supabaseClient');

async function runDiagnostic() {
  console.log('\n=== RecoverAI Diagnostic ===\n');

  // 1. Check env vars
  console.log('1. ENV CHECK:');
  console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   NODE_ENV:', process.env.NODE_ENV);

  // 2. Test Gemini
  console.log('\n2. GEMINI TEST (gemini-1.5-flash):');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello in one word.');
    console.log('   ✅ Gemini works! Response:', result.response.text().trim());
  } catch (e) {
    console.error('   ❌ Gemini FAILED:', e.message);
  }

  // 3. Test Supabase read
  console.log('\n3. SUPABASE READ TEST:');
  try {
    const { data, error } = await supabase.from('abandoned_carts').select('id').limit(1);
    if (error) console.error('   ❌ Supabase read FAILED:', error.message);
    else console.log('   ✅ Supabase read works! Rows found:', data.length);
  } catch (e) {
    console.error('   ❌ Supabase exception:', e.message);
  }

  // 4. Test Supabase write to recovery_attempts
  console.log('\n4. SUPABASE WRITE TEST (recovery_attempts):');
  try {
    const { data, error } = await supabase.from('recovery_attempts').insert([{
      cart_id: null,
      attempt_number: 0,
      message_type: 'diagnostic_test',
      discount_percent: 0,
      agent_reasoning: 'Diagnostic test row',
      email_subject: 'Diagnostic Test',
      email_body: 'Test',
      delay_hours_used: 0,
      cart_value: 0,
      user_type: 'test',
      customer_email: 'diagnostic@test.com',
      converted: false
    }]).select();
    if (error) console.error('   ❌ Supabase write FAILED:', error.message, '| Code:', error.code);
    else console.log('   ✅ Supabase write works! Row ID:', data[0].id);
  } catch (e) {
    console.error('   ❌ Supabase write exception:', e.message);
  }

  // 5. Test SendGrid
  console.log('\n5. SENDGRID TEST:');
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const [response] = await sgMail.send({
      to: process.env.SENDER_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: 'RecoverAI Diagnostic Test',
      text: 'If you see this, SendGrid is working!'
    });
    console.log('   ✅ SendGrid works! Status:', response.statusCode);
  } catch (e) {
    console.error('   ❌ SendGrid FAILED:', e.message);
  }

  console.log('\n=== Diagnostic Complete ===\n');
  process.exit(0);
}

runDiagnostic();
