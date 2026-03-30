const core = require("@actions/core");

exports.NotifyClassroom = async function NotifyClassroom(runnerResults) {
    let { totalPoints, maxPoints } = runnerResults.reduce(
        (acc, { results }) => {
            if (!results.max_score) return acc;

            acc.maxPoints += Number(results.max_score);
            results.tests.forEach(({ score }) => {
                acc.totalPoints += Number(score);
            });

            return acc;
        },
        { totalPoints: 0, maxPoints: 0 }
    );
    if (!maxPoints) return;

    console.log(process.env.TOTAL_POINTS_OVERRIDE)
    maxPoints = process.env.TOTAL_POINTS_OVERRIDE
        ? parseFloat(process.env.TOTAL_POINTS_OVERRIDE)
        : maxPoints;

    console.log(process.env.CAP_AT_MAX)
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