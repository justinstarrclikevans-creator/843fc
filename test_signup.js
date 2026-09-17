const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://uawiigtmxggzsnbfksqb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhd2lpZ3RteGdnenNuYmZrc3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDU4NzYsImV4cCI6MjEwMzQyMTg3Nn0.YRw63AwAbAx2UwzOVi95jVEl8CUx3xgACgaL3VQsVqs');

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_demo_player@example.com',
    password: 'password123'
  });
  console.log(data, error);
}
test();
