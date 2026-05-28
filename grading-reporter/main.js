const core = require("@actions/core");
const { ConsoleResults } = require("./console-results");
const { NotifyClassroom } = require("./notify-classroom");

function isBase64(str) {
  if (!str || typeof str !== "string") {
    return false;
  }

  // remove espaços/quebras
  const normalized = str.trim();

  // base64 válido normalmente só contém isso
  if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) {
    return false;
  }

  try {
    const decoded = Buffer.from(normalized, "base64").toString("base64");

    return (
      decoded.replace(/=+$/, "") ===
      normalized.replace(/=+$/, "")
    );
  } catch {
    return false;
  }
}

function parseResults(runner, rawResults) {
  // fallback vazio
  if (!rawResults || rawResults.trim() === "") {
    return {
      version: 1,
      status: "error",
      max_score: 0,
      tests: [
        {
          name: runner,
          status: "error",
          score: 0,
          message: "Empty runner results"
        }
      ]
    };
  }

  // tenta JSON puro
  try {
    return JSON.parse(rawResults);
  } catch (_) {}

  // tenta base64
  if (!isBase64(rawResults)) {
    throw new Error(
      `Runner "${runner}" produced invalid JSON/base64 data`
    );
  }

  let decoded;

  try {
    decoded = Buffer.from(rawResults, "base64").toString("utf8");
  } catch (e) {
    throw new Error(
      `Runner "${runner}" base64 decode failed: ${e.message}`
    );
  }

  // DEBUG OPCIONAL
  /*
  console.log("RUNNER:", runner);
  console.log("RAW LENGTH:", rawResults.length);
  console.log("DECODED START:");
  console.log(decoded.slice(0, 300));
  */

  try {
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Decoded content start:");
    console.error(decoded.slice(0, 500));

    throw new Error(
      `Runner "${runner}" produced invalid decoded JSON: ${e.message}`
    );
  }
}

try {
  const runnersInput = core.getInput("runners");

  const runnerResults = runnersInput
    .split(",")
    .map((runner) => {
      const trimmedRunner = runner.trim();

      const envName =
        `${trimmedRunner.toUpperCase()}_RESULTS`;

      const rawResults =
        process.env[envName] || "";

      const results = parseResults(
        trimmedRunner,
        rawResults
      );

      return {
        runner: trimmedRunner,
        results
      };
    });

  ConsoleResults(runnerResults);
  NotifyClassroom(runnerResults);

  if (
    runnerResults.some(
      (r) => r.results.status === "fail"
    )
  ) {
    core.setFailed("Some tests failed.");
  } else if (
    runnerResults.some(
      (r) => r.results.status === "error"
    )
  ) {
    core.setFailed("Some tests errored.");
  }

} catch (error) {
  const input = core.getInput("runners");

  const pattern =
    /^([a-zA-Z0-9]+,)*[a-zA-Z0-9]+$/;

  if (!pattern.test(input)) {
    console.error(
      "The runners input must be a comma-separated list of strings."
    );

    core.setFailed(
      "The runners input must be a comma-separated list of strings."
    );
  } else {
    console.error(error);

    core.setFailed(error.message);
  }
}
