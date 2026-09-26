import { rename, writeFile } from 'node:fs/promises';

const username = 'ytchou';
const apiUrl = 'https://api.github.com/graphql';
const outputPath = new URL('../src/data/github-contributions.json', import.meta.url);
const temporaryPath = new URL('../src/data/github-contributions.json.tmp', import.meta.url);
const token = process.env.PORTFOLIO_GITHUB_TOKEN;
const query = `query ContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
  }
}`;

function logAudit({ requestPayload, responsePayload = null, latencyMs = 0, httpStatus = null, outcome, error }) {
  console.log(JSON.stringify({
    event: 'github-contribution-calendar',
    requestPayload,
    responsePayload,
    latencyMs,
    httpStatus,
    outcome,
    ...(error ? { error } : {}),
  }));
}

if (!token) {
  logAudit({ outcome: 'skipped', error: 'PORTFOLIO_GITHUB_TOKEN is not set' });
} else {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 364));
  const from = fromDate.toISOString().slice(0, 10);
  const requestPayload = {
    query,
    variables: {
      login: username,
      from: `${from}T00:00:00Z`,
      to: `${to}T23:59:59Z`,
    },
  };
  const startedAt = performance.now();
  let responsePayload = null;
  let httpStatus = null;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
    httpStatus = response.status;
    const responseText = await response.text();

    try {
      responsePayload = JSON.parse(responseText);
    } catch {
      responsePayload = responseText;
    }

    if (!response.ok) {
      logAudit({
        requestPayload,
        responsePayload,
        latencyMs: Math.round(performance.now() - startedAt),
        httpStatus: response.status,
        outcome: 'http_error',
      });
    } else if (typeof responsePayload !== 'object' || responsePayload === null) {
      logAudit({
        requestPayload,
        responsePayload,
        latencyMs: Math.round(performance.now() - startedAt),
        httpStatus: response.status,
        outcome: 'invalid_response',
      });
    } else {
      const calendar = responsePayload.data?.user?.contributionsCollection?.contributionCalendar;

      if (responsePayload.errors?.length || !calendar) {
        logAudit({
          requestPayload,
          responsePayload,
          latencyMs: Math.round(performance.now() - startedAt),
          httpStatus: response.status,
          outcome: 'graphql_error',
        });
      } else {
        const validLevels = new Set([
          'NONE',
          'FIRST_QUARTILE',
          'SECOND_QUARTILE',
          'THIRD_QUARTILE',
          'FOURTH_QUARTILE',
        ]);
        const days = calendar.weeks.flatMap(week => week.contributionDays)
          .filter(day => day.date >= from && day.date <= to)
          .map(day => ({
            date: day.date,
            count: day.contributionCount,
            level: day.contributionLevel,
          }));
        const expectedDates = Array.from({ length: 365 }, (_, index) => {
          const date = new Date(fromDate);
          date.setUTCDate(date.getUTCDate() + index);
          return date.toISOString().slice(0, 10);
        });
        const hasValidDays = days.length === expectedDates.length
          && days.every((day, index) => day.date === expectedDates[index]
            && Number.isInteger(day.count)
            && day.count >= 0
            && validLevels.has(day.level));
        const dailyTotal = days.reduce((sum, day) => sum + day.count, 0);

        if (!hasValidDays || dailyTotal !== calendar.totalContributions) {
          logAudit({
            requestPayload,
            responsePayload,
            latencyMs: Math.round(performance.now() - startedAt),
            httpStatus: response.status,
            outcome: 'validation_error',
          });
        } else {
          const snapshot = {
            username,
            from,
            to,
            updatedAt: now.toISOString(),
            totalContributions: calendar.totalContributions,
            days,
          };
          await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`);
          await rename(temporaryPath, outputPath);
          logAudit({
            requestPayload,
            responsePayload,
            latencyMs: Math.round(performance.now() - startedAt),
            httpStatus: response.status,
            outcome: 'updated',
          });
        }
      }
    }
  } catch (error) {
    logAudit({
      requestPayload,
      responsePayload,
      latencyMs: Math.round(performance.now() - startedAt),
      httpStatus,
      outcome: 'request_error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
