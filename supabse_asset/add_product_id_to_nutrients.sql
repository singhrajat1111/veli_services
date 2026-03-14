-- Run this FIRST in Supabase SQL Editor
-- Adds product_id foreign key to nutrients table

ALTER TABLE nutrients 
ADD COLUMN product_id UUID REFERENCES products(id);
