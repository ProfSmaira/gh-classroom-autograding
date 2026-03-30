const core = require("@actions/core");

exports.NotifyClassroom = async function NotifyClassroom(runnerResults) {
    let { totalPoints, maxPoints } = runnerResults.reduce(
        (acc, { results }) => {
            const runnerMax = Number(results.max_score);
            if (Number.isFinite(runnerMax)) {
                acc.maxPoints += runnerMax;
            }

            results.tests.forEach(({ score }) => {
                const testScore = Number(score);
                if (Number.isFinite(testScore)) {
                    acc.totalPoints += testScore;
                }
            });

            return acc;
        },
        { totalPoints: 0, maxPoints: 0 }
    );

    console.log(`[debug] raw totals totalPoints=${totalPoints} maxPoints=${maxPoints}`);

    const overrideMaxRaw = process.env.TOTAL_POINTS_OVERRIDE;
    if (overrideMaxRaw !== undefined && overrideMaxRaw !== "") {
        const overrideMax = parseFloat(overrideMaxRaw);
        if (Number.isFinite(overrideMax)) {
            maxPoints = overrideMax;
        }
    }

    console.log(`[debug] after override maxPoints=${maxPoints} overrideRaw=${overrideMaxRaw ?? ""}`);

    if (!maxPoints) {
        console.log("[debug] maxPoints is falsy; returning without publishing notice");
        return;
    }

    const shouldCap = process.env.CAP_AT_MAX === "true";

    if(shouldCap && totalPoints > maxPoints) {
        totalPoints = maxPoints;
    }

    const intTotal = Math.round(totalPoints*10);
    const intMax = Math.round(maxPoints*10);

    console.log(`[debug] scaled totals totalPoints=${intTotal} maxPoints=${intMax}`);

    const text = `Points ${intTotal}/${intMax}`;
    const summary = JSON.stringify({ totalPoints: intTotal, maxPoints: intMax });

    console.log(`[debug] summary ${summary}`);
    console.log(text);

    core.notice(text, {
        title: "Autograding complete",
    });

    core.notice(summary, {
        title: "Autograding report",
    });
};