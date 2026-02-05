DO $$
DECLARE
  v_user RECORD;
  v_code TEXT;
BEGIN
  FOR v_user IN
    SELECT id
    FROM users
    WHERE "codeId" IS NULL
  LOOP
    LOOP
      v_code := upper(substring(md5(random()::text), 1, 6));

      IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE "codeId" = v_code
      ) THEN
        UPDATE users
        SET "codeId" = v_code
        WHERE id = v_user.id; 

        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;