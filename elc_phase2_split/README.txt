PETATOE v9 — ELC Phase 2 SQL Editor Safe Import

The original single query exceeded the Supabase SQL Editor size limit.
Run the files in numeric order, one file per new SQL query:

01_import_part_1.sql
02_import_part_2.sql
03_import_part_3.sql
04_import_part_4.sql
05_import_part_5.sql
06_import_part_6.sql
07_verify_import.sql

Each import file:
- creates no tables
- is idempotent
- preserves existing approved values
- imports Arabic and English
- queues missing English and all Filipino translations

Expected snapshot: 1278 keys, 1278 Arabic, 1269 English, 9 English pending, 1278 Filipino pending (unless existing data changes totals).
