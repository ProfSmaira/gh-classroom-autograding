const core = require('@actions/core')
const {execSync} = require('child_process')

const env = {
    PATH: process.env.PATH,
    FORCE_COLOR: 'true',
    DOTNET_CLI_HOME: '/tmp',
    DOTNET_NOLOGO: 'true',
    HOME: process.env.HOME,
}

function btoa(str) {
    return Buffer.from(str).toString('base64')
}

function generateResult(status, testName, command, message, duration, maxScore, actualScore) {
    return {
        version: 1,
        status,
        max_score: maxScore,
        tests: [
            {
                name: testName,
                status,
                score: actualScore, // Usa a nota float/parcial
                message,
                test_code: command,
                filename: '',
                line_no: 0,
                duration,
            },
        ],
    }
}

function getErrorMessageAndStatus(error, command) {
    if (error.message.includes('ETIMEDOUT')) {
        return { status: 'error', errorMessage: 'Command timed out' }
    }
    if (error.message.includes('command not found')) {
        return { status: 'error', errorMessage: `Unable to locate executable file: ${command}` }
    }
    if (error.message.includes('Command failed')) {
        return { status: 'fail', errorMessage: 'failed with exit code 1' }
    }
    return  { status: 'error', errorMessage: error.message }
}

function extractCustomScore(output, defaultScore) {
    if (!output) return defaultScore;
    const match = output.toString().match(/SCORE[:=]\s*([0-9.]+)/i);
    if (match) {
        return parseFloat(match[1]);
    }
    return defaultScore;
}

function run() {
    const testName = core.getInput('test-name', {required: true})
    const setupCommand = core.getInput('setup-command')
    const command = core.getInput('command', {required: true})
    const timeout = parseFloat(core.getInput('timeout') || 10) * 60000
    const maxScore = parseFloat(core.getInput('max-score') || 0)

    let output = ''
    let startTime
    let endTime
    let result

    try {
        if (setupCommand) {
            execSync(setupCommand, {timeout, env, stdio: 'inherit'})
        }

        startTime = new Date()
        output = execSync(command, {timeout, env})?.toString()
        endTime = new Date()

        if (output) console.log(output);

        let actualScore = extractCustomScore(output, maxScore);
        result = generateResult('pass', testName, command, output, endTime - startTime, maxScore, actualScore)
    } catch (error) {
        endTime = new Date()
        output = error.stdout ? error.stdout.toString() : ''

        if (output) console.log(output);

        const {status, errorMessage} = getErrorMessageAndStatus(error, command)

        let actualScore = extractCustomScore(output, 0);
        result = generateResult(status, testName, command, errorMessage + '\n' + output, endTime - startTime, maxScore, actualScore)
    }

    core.setOutput('result', btoa(JSON.stringify(result)))
}

run()