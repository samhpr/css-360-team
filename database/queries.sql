-- all events, soonest first
SELECT name, date, venue, ticket_link
FROM events
ORDER BY date ASC;


-- jazz only
SELECT *
FROM events
WHERE genre = 'Jazz';


-- the "all" option
SELECT *
FROM events
ORDER BY date ASC;


-- no matches (empty result)
SELECT *
FROM events
WHERE genre = 'Polka';


-- distinct genres for the dropdown
SELECT DISTINCT genre
FROM events
ORDER BY genre ASC;


-- events under $50
SELECT name, ticket_price
FROM events
WHERE ticket_price < 50
ORDER BY ticket_price ASC;


-- ada-compliant venues
SELECT name, venue, is_ada_compliant
FROM events
WHERE is_ada_compliant = TRUE
ORDER BY date ASC;
