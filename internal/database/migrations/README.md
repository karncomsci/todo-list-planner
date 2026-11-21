# Migrations

goose SQL migrations, embedded in the binary and applied when the API starts.

- Name each file `NNNNN_short_description.sql` with the next five-digit number, for example `00001_create_owners.sql`. Applied migrations are never edited; a change is a new file.
- Each file holds a `-- +goose Up` section and a `-- +goose Down` section.
- sqlc reads this folder as the schema, so the SQL here is also the source of the generated Go types.
