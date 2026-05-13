UPDATE auth.users
SET encrypted_password = crypt('Starbridge2026!', gen_salt('bf'));
