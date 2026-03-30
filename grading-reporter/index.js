const core = require("@actions/core");

exports.NotifyClassroom = async function NotifyClassroom(runnerResults) {
    const { totalPoints, maxPoints } = runnerResults.reduce(
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