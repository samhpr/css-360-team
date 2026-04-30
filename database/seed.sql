-- mirrors frontend/src/data/events.js

INSERT INTO events (id, name, genre, date, location, venue, ticket_link, ticket_price, is_ada_compliant) VALUES
  (1, 'Northside Noise Fest', 'Rock',       '2026-04-25', 'Seattle, WA',  'Emerald Hall',      'https://tickets.example.com/northside',   120, FALSE),
  (2, 'Jazz by the Lake',     'Jazz',       '2026-04-24', 'Bellevue, WA', 'Lakefront Arena',   'https://tickets.example.com/jazz-lake',    15, TRUE),
  (3, 'Sunset Beats',         'Electronic', '2026-05-02', 'Tacoma, WA',   'Pulse Club',        'https://tickets.example.com/sunset-beats',  55, FALSE),
  (4, 'Folk in the Park',     'Folk',       '2026-04-30', 'Seattle, WA',  'Green Stage',       'https://tickets.example.com/folk-park',     30, TRUE),
  (5, 'Indie Friday Night',   'Indie',      '2026-04-26', 'Redmond, WA',  'Riverside Theater', 'https://tickets.example.com/indie-friday',  80, TRUE);
