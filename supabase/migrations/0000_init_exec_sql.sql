-- Create function to execute SQL (requires superuser)
create or replace function exec_sql(query text)
returns void
language plpgsql
security definer
as $$
begin
  execute query;
end;
$$; 