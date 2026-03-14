-- Custom SQL migration file, put your code below! --

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "app"."addresses"
    ADD COLUMN "coordinates" geography(Point, 4326);
ALTER TABLE "app"."devices"
    ADD COLUMN "coordinates" geography(Point, 4326);
ALTER TABLE "app"."delivery_events"
    ADD COLUMN "coordinates" geography(Point, 4326);