import assert from "node:assert/strict";
import test from "node:test";
import { parseAstrologyDailyJson, parseNewsDataJson } from "./fetchFeed";

test("parseNewsDataJson maps current publisher fields", () => {
  const items = parseNewsDataJson(JSON.stringify({
    results: [{
      title: "Jackpot update",
      link: "https://example.com/jackpot-update",
      description: "A current lottery brief.",
      pubDate: "2026-07-11 12:30:00",
      image_url: "https://example.com/image.jpg",
      keywords: ["lottery", "jackpot"],
      category: ["top"],
      source_name: "Example News",
      source_url: "https://example.com",
    }],
  }));

  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    title: "Jackpot update",
    link: "https://example.com/jackpot-update",
    description: "A current lottery brief.",
    publishedAt: "2026-07-11 12:30:00",
    imageUrl: "https://example.com/image.jpg",
    tags: ["lottery", "jackpot", "top"],
    sourceName: "Example News",
    sourceUrl: "https://example.com",
  });
});

test("parseNewsDataJson safely handles an empty payload", () => {
  assert.deepEqual(parseNewsDataJson("{}"), []);
});

test("parseNewsDataJson excludes unrelated latest-news results", () => {
  const items = parseNewsDataJson(JSON.stringify({
    results: [
      { title: "Local council approves parking plan", link: "https://example.com/parking" },
      { title: "Powerball jackpot reaches a new high", link: "https://example.com/powerball" },
    ],
  }));

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, "Powerball jackpot reaches a new high");
});

test("parseNewsDataJson keeps horoscope stories for the horoscope source", () => {
  const items = parseNewsDataJson(JSON.stringify({
    results: [
      {
        title: "Daily horoscope for every zodiac sign",
        description: "Astrology guidance for the day ahead.",
        link: "https://example.com/daily-horoscope",
        keywords: ["horoscope", "zodiac"],
      },
      { title: "Global markets open higher", link: "https://example.com/markets" },
    ],
  }), "newsdata-horoscopes");

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, "Daily horoscope for every zodiac sign");
});

test("parseNewsDataJson can match horoscope metadata when the title is concise", () => {
  const items = parseNewsDataJson(JSON.stringify({
    results: [{
      title: "Your Monday outlook",
      description: "A horoscope forecast based on astrology and moon cycles.",
      link: "https://example.com/monday-outlook",
    }],
  }), "newsdata-horoscopes");

  assert.equal(items.length, 1);
});

test("parseAstrologyDailyJson normalizes a daily sign forecast", () => {
  const items = parseAstrologyDailyJson(JSON.stringify({
    status: true,
    sun_sign: "aries",
    prediction_date: "13-7-2026",
    prediction: {
      emotions: "Keep the day steady",
      luck: "A small opportunity may appear",
      personal_life: "Listen before making plans",
    },
  }), "aries");

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, "Aries Daily Horoscope");
  assert.equal(items[0]?.publishedAt, "2026-07-13T12:00:00.000Z");
  assert.equal(items[0]?.sourceName, "AstrologyAPI");
  assert.deepEqual(items[0]?.tags, ["horoscope", "zodiac", "daily astrology", "aries"]);
});

test("parseAstrologyDailyJson rejects failed forecasts", () => {
  assert.deepEqual(parseAstrologyDailyJson(JSON.stringify({ status: false }), "aries"), []);
});
