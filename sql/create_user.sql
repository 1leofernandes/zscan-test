INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Admin User',
  'leonardoff24@gmail.com',
  '$2b$10$q17oISBGuyehhjodeuzPrOs7weR9Tp3zwAoU/f4wOXt9FBqNODMYO',
  'super_admin',
  true,
  NOW(),
  NOW()
);
