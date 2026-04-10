function removeTextNoise(text) {
    return text
        .replace(/\r/g, '')               // strip carriage returns
        .replace(/\n{3,}/g, '\n\n')       // collapse 3+ newlines to 2
        .replace(/\s{2,}/g, ' ')          // collapse 2+ spaces into 1
        .replace(/[ \t]{2,}/g, ' ')       // collapse inline whitespace
        .trim();

}

module.exports = { removeTextNoise };
