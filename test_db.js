import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const { data: deals, error } = await supabase.from('deals').select('*');
    console.log(deals, error);

    const { data: trx, error: trxErr } = await supabase.from('transactions').select('*');
    console.log(trx, trxErr);

    const { data: users, error: userErr } = await supabase.from('users').select('*');
    console.log(users, userErr);
}
main();
