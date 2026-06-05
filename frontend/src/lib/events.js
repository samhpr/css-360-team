function normalizeValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeValue(value) {
  const normalized = normalizeValue(value);
  return normalized ? normalized.split(" ") : [];
}

function levenshteinDistance(left, right) {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      currentRow[rightIndex] = Math.min(
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + substitutionCost,
      );
    }

    for (let rightIndex = 0; rightIndex < previousRow.length; rightIndex += 1) {
      previousRow[rightIndex] = currentRow[rightIndex];
    }
  }

  return previousRow[right.length];
}

function matchesFuzzyText(candidate, query) {
  const normalizedCandidate = normalizeValue(candidate);
  const normalizedQuery = normalizeValue(query);

  if (!normalizedCandidate || !normalizedQuery) {
    return false;
  }

  if (normalizedCandidate.includes(normalizedQuery) || normalizedQuery.includes(normalizedCandidate)) {
    return true;
  }

  if (levenshteinDistance(normalizedCandidate, normalizedQuery) <= 1) {
    return true;
  }

  const candidateTokens = tokenizeValue(candidate);
  const queryTokens = tokenizeValue(query);

  return queryTokens.every((queryToken) =>
    candidateTokens.some(
      (candidateToken) =>
        candidateToken.includes(queryToken) || levenshteinDistance(candidateToken, queryToken) <= 1,
    ),
  );
}

export function sortByDate(events, order = "soonest") {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return order === "soonest" ? dateA - dateB : dateB - dateA;
  });
}

// Kept for backward compatibility — equivalent to sortByDate(events, "soonest").
export function sortByDateAscending(events) {
  return sortByDate(events, "soonest");
}
export function filterByGenre(events, genre) {
  if (!genre || genre === "All") {
    return events;
  }

  return events.filter((event) => event.genre === genre);
}

export function searchEvents(events, query) {
  if (!query.trim()) {
    return events;
  }

  return events.filter((event) => {
    const fields = [event.name, event.location, event.venue, event.genre];
    return fields.some((field) => matchesFuzzyText(field, query));
  });
}

export function getCalendarMap(events) {
  return events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});
}

export function getGenreOptions(events) {
  const genres = Array.from(new Set(events.map((event) => event.genre)));
  return ["All", ...genres.sort((a, b) => a.localeCompare(b))];
}

export function filterByZipCode(events, zipCode) {
  if (!zipCode || zipCode === "All") {
    return events;
  }

  const normalizedQuery = normalizeValue(zipCode).replace(/\s+/g, "");
  const exactMatches = events.filter((event) => {
    const normalizedZip = normalizeValue(event.zipCode).replace(/\s+/g, "");

    return normalizedZip && normalizedZip === normalizedQuery;
  });

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  return events.filter((event) => {
    const normalizedZip = normalizeValue(event.zipCode).replace(/\s+/g, "");

    if (!normalizedZip || !normalizedQuery) {
      return false;
    }

    if (normalizedZip.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedZip)) {
      return true;
    }

    return levenshteinDistance(normalizedZip, normalizedQuery) <= 1;
  });
}

export function getZipCodeOptions(events) {
  const zips = Array.from(new Set(events.map((event) => event.zipCode).filter(Boolean)));
  return ["All", ...zips.sort()];
}
