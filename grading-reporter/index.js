const core = require("@actions/core");

exports.NotifyClassroom = async function NotifyClassroom(runnerResults) {
    const { totalPoints, maxPoints } = runnerResults.reduce(
        (acc, { results }) => {
            if (!results.max_score) return acc;

            acc.maxPoints += results.max_score;
            results.tests.forEach(({ score }) => {
                acc.totalPoints += score;
            });

            return acc;
        },
        { totalPoints: 0, maxPoints: 0 }
    );
    if (!maxPoints) return;

    const formattedTotal = Number(totalPoints.toFixed(2));
    const formattedMax = Number(maxPoints.toFixed(2));

    const text = `Points ${formattedTotal}/${formattedMax}`;
    const summary = JSON.stringify({ totalPoints: formattedTotal, maxPoints: formattedMax })

    core.notice(text, {
        title: "Autograding complete",
    })

    core.notice(summary, {
        title: "Autograding report",
    })
};