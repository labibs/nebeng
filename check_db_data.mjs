import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://osoryiixxzufkvsftkai.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SB4mhy1M_1BwN0coZVD7sA_RDOXpAFv';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabase() {
  console.log('🔍 Checking database structure and data...\n');

  try {
    // Check deals table
    console.log('📋 Fetching deals table data:');
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, carrier_id, depositor_id, post_id, status, created_at')
      .limit(10);

    if (dealsError) {
      console.error('❌ Error fetching deals:', dealsError);
    } else {
      console.log(`✅ Found ${deals?.length || 0} deals`);
      if (deals && deals.length > 0) {
        console.log('\nFirst deal sample:');
        console.log(JSON.stringify(deals[0], null, 2));
        console.log('\nAll deals:');
        console.log(JSON.stringify(deals, null, 2));
      } else {
        console.log('   (no deals found)');
      }
    }

    // Check transactions table
    console.log('\n📋 Fetching transactions table data:');
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('id, deal_id, transaction_status, gross_amount, created_at')
      .limit(10);

    if (txnError) {
      console.error('❌ Error fetching transactions:', txnError);
    } else {
      console.log(`✅ Found ${transactions?.length || 0} transactions`);
      if (transactions && transactions.length > 0) {
        console.log('\nFirst transaction sample:');
        console.log(JSON.stringify(transactions[0], null, 2));
        console.log('\nAll transactions:');
        console.log(JSON.stringify(transactions, null, 2));
      } else {
        console.log('   (no transactions found)');
      }
    }

    // Check users table
    console.log('\n📋 Fetching users table data:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_id, name')
      .limit(10);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`✅ Found ${users?.length || 0} users`);
      if (users && users.length > 0) {
        console.log('\nFirst user sample:');
        console.log(JSON.stringify(users[0], null, 2));
        console.log('\nAll users:');
        console.log(JSON.stringify(users, null, 2));
      } else {
        console.log('   (no users found)');
      }
    }

    // Check if carrier_id values look like clerk_id or UUID
    if (deals && deals.length > 0) {
      console.log('\n🔎 Analyzing carrier_id format in deals:');
      const sample = deals[0];
      if (sample.carrier_id) {
        console.log(`   Sample carrier_id: "${sample.carrier_id}"`);
        if (sample.carrier_id.startsWith('user_')) {
          console.log('   ✅ Format: Looks like Clerk ID (user_...)');
        } else if (sample.carrier_id.match(/^[a-f0-9]{8}-[a-f0-9]{4}/)) {
          console.log('   ❌ Format: Looks like UUID (should be user_...)');
        } else {
          console.log('   ⚠️  Format: Unknown');
        }
      }
    }

  } catch (err) {
    console.error('🔥 Fatal error:', err);
  }
}

checkDatabase();
