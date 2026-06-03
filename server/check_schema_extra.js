import { supabase } from "./config/supabaseClient.js";

async function showSchemaExtra() {
  const tables = ['targets', 'project_tasks', 'project_comments', 'files', 'lead_payments', 'lead_messages', 'lead_activities'];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    if (error) {
      console.log(`Table: ${table} - Error/Not found:`, error.message);
    } else {
      console.log(`Table: ${table} - Fields:`, data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    }
  }
}

showSchemaExtra();
