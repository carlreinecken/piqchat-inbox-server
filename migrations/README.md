# Migration

Create the database with a default user

```
sqlite3 db.sqlite < migration/init.sql
```

## Fixtures Test Data

Fill the database with some test data

```
sqlite3 db.sqlite < migration/fixtures.sql
```

## Change Stuff

1. Add a .sql file to the `migration/scripts/` directory
2. Name the file like the previous files: the current date and a short description what this file does
3. Add `.read migration/scripts/?.sql` to `migration/all-migrations.sql` for future database initializations
4. Run your migration with `sqlite3 db.sqlite < migration/scripts/?.sql`
