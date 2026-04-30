DROP TABLE IF EXISTS events;

CREATE TABLE events (
  id               INTEGER PRIMARY KEY,
  name             TEXT    NOT NULL,
  genre            TEXT    NOT NULL,
  date             DATE    NOT NULL,
  location         TEXT    NOT NULL,
  venue            TEXT    NOT NULL,
  ticket_link      TEXT    NOT NULL,
  ticket_price     INTEGER NOT NULL,
  is_ada_compliant BOOLEAN NOT NULL
);
