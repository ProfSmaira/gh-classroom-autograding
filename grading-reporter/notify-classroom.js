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

    const overrideMaxRaw = process.env.TOTAL_POINTS_OVERRIDE;
    if (overrideMaxRaw !== undefined && overrideMaxRaw !== "") {
        const overrideMax = parseFloat(overrideMaxRaw);
        if (Number.isFinite(overrideMax)) {
            maxPoints = overrideMax;
        }
    }

    if (!maxPoints) return;

    const shouldCap = process.env.CAP_AT_MAX === "true";

    if(shouldCap && totalPoints > maxPoints) {
        totalPoints = maxPoints;
    }

    const intTotal = Math.round(totalPoints*10);
    const intMax = Math.round(maxPoints*10);

    const text = `Points ${intTotal}/${intMax}`;
    const summary = JSON.stringify({ totalPoints: intTotal, maxPoints: intMax });

    console.log(text);

    core.notice(text, {
        title: "Autograding complete",
    });

    core.notice(summary, {
        title: "Autograding report",
    });
};