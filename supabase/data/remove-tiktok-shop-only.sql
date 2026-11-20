-- Removal ordered by Ultra Vestra 2026-11-20: brands that are ONLY on TikTok Shop come out of the directory.
-- SKIN1004 is the only such brand already loaded in the database (batch 4).
-- Its recorded route was "TikTok Shop via ShortFormNation" with no live brand-direct program.
-- All child tables reference brands(id) ON DELETE CASCADE or SET NULL, so this one delete cleans every child row.
delete from public.brands where name = 'SKIN1004';
