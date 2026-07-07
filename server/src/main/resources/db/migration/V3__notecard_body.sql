-- Add body column to store TipTap/ProseMirror JSON document tree
ALTER TABLE notecards ADD COLUMN body TEXT;

-- Migrate existing content to body as plain text JSON structure
UPDATE notecards
SET body = jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
        jsonb_build_object(
            'type', 'paragraph',
            'content', CASE
                WHEN content IS NOT NULL AND content != ''
                THEN jsonb_build_array(jsonb_build_object('type', 'text', 'text', content))
                ELSE '[]'::jsonb
            END
        )
    )
)::text
WHERE body IS NULL;
