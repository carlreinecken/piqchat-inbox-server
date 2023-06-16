# Migration

Create the database with a default user

```
sqlite3 database.sqlite < migrations/all.sql
```

## Fixtures Test Data

Fill the database with some test data

```
sqlite3 database.sqlite < migrations/fixtures.sql
```

## Change Stuff

1. Add a .sql file to the `migrations/scripts/` directory
2. Name the file like the previous files: the current date and a short description what this file does
3. Add `.read migrations/scripts/?.sql` to `migrations/all.sql` for future database initializations
4. Run your migrations with `sqlite3 database.sqlite < migrations/scripts/?.sql`
