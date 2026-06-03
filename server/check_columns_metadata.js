import { supabase } from "./config/supabaseClient.js";

async function showDbColumns() {
  const tables = ['targets', 'project_tasks', 'project_comments', 'files', 'lead_messages'];
  for (const table of tables) {
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: table }); // Wait, if RPC doesn't exist, we can use a direct SQL via REST, but REST doesn't allow raw SQL.
    
    // Instead of raw SQL, we can try to insert a dummy/empty row with invalid structure to see the schema error, 
    // or select columns using standard select * with a false condition like id.eq.0
    const { data: dummy, error: selectError } = await supabase
      .from(table)
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000');
    
    if (selectError) {
      console.log(`Table: ${table} - Select Error:`, selectError.message);
    } else {
      console.log(`Table: ${table} - Columns:`, dummy !== null ? 'Columns retrieved successfully!' : 'Null data');
    }
  }
}

showDbColumns();
