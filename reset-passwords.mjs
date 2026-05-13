// reset-passwords.mjs
// Uses the Supabase Admin API (service_role key) to properly reset all user passwords
// Run with: node reset-passwords.mjs

import { createClient } from '@supabase/supabase-js';

// ⚠️  Paste your service_role key here (from Supabase Dashboard → Settings → API)
const SUPABASE_URL = 'https://acrzypzzbbkdisietjlf.supabase.co';
const SERVICE_ROLE_KEY = 'PASTE_SERVICE_ROLE_KEY_HERE';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  { id: 'e1b7791a-aa41-4221-9a6a-f87ae4c3fb21', email: 'richkevonlinestore@gmail.com', password: 'RichKev2026!' },
  { id: '2bc8c483-c027-4a02-a128-3065b33ed6c8', email: 'johnnynjsh@gmail.com',           password: 'Johnny2026!' },
  { id: 'e1b9eefe-c6c6-41ad-b208-6e5e17ed9ff6', email: 'cloud@techlabenterprises.com',   password: 'CloudTech2026!' },
  { id: '089a63f0-547c-4440-ae01-2f3f51cfc2ed', email: 'sadiyafarah@starbridgetutoring.com', password: 'Sadiya2026!' },
  { id: '79971e4f-f7c0-4b55-a647-916f9cca20bb', email: 'knet7763@gmail.com',              password: 'Knet2026!' },
];

async function resetPasswords() {
  console.log('Starting password reset via Admin API...\n');
  for (const user of users) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: user.password,
    });
    if (error) {
      console.error(`❌  FAILED  ${user.email}: ${error.message}`);
    } else {
      console.log(`✅  OK      ${user.email}  →  ${user.password}`);
    }
  }
  console.log('\nDone!');
}

resetPasswords();
