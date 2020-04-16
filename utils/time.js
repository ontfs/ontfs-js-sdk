const MILLI_SECOND = 1;
const SECOND = 1000 * MILLI_SECOND;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const sleep = (ms = 0) => {
    return new Promise(r => setTimeout(r, ms));
}


module.exports = {
    MILLI_SECOND,
    SECOND,
    MINUTE,
    HOUR,
    sleep
}