alter table "public"."profiles" 
  add column "email" text not null default '',
  add column "is_available" boolean not null default false; 