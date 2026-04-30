-- ============================================================
-- Demo queries for Sprint 1 user stories (SCRUM-5, SCRUM-7).
-- Run via: bash database/setup.sh
-- ============================================================

-- SCRUM-5: every card needs name, date, venue, ticket link.
-- Sorted by date so the soonest show is first.
SELECT name, date, venue, ticket_link
FROM events
ORDER BY date ASC;


-- SCRUM-7: selecting a genre returns only events in that genre.
SELECT *
FROM events
WHERE genre = 'Jazz';


-- SCRUM-7: the "All" / clear-filters option returns every event.
SELECT *
FROM events
ORDER BY date ASC;


-- SCRUM-7: when no events match the genre, the result set is empty
-- (the frontend renders the "No concerts match" empty state).
SELECT *
FROM events
WHERE genre = 'Polka';


-- SCRUM-7: the genre dropdown's options come from the distinct genres
-- present in the data — this is the query that backs that list.
SELECT DISTINCT genre
FROM events
ORDER BY genre ASC;


-- ------------------------------------------------------------
-- Bonus queries — back the additional v0.5 filters fsinnott added
-- (price range, ADA compliance). Not in SCRUM-5/7 DoD but useful
-- to show the schema covers everything the UI needs.
-- ------------------------------------------------------------

-- Events under $50.
SELECT name, ticket_price
FROM events
WHERE ticket_price < 50
ORDER BY ticket_price ASC;


-- ADA-compliant venues only.
SELECT name, venue, is_ada_compliant
FROM events
WHERE is_ada_compliant = TRUE
ORDER BY date ASC;
