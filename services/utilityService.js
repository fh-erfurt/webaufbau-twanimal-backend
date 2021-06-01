function isStringValid(value, min, max, nullable = false) {
    if (value == null && nullable) return true
    if (value == null && !nullable) return false
    if (!(typeof value === "string" || value instanceof String)) return false

    if (value.length < min) return false
    if (value.length > max) return false

    return true
}

function isEmailValid(value) {
    if (
        value == null ||
        !(typeof value === "string" || value instanceof String)
    )
        return false
    const regex =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    return regex.test(value)
}

module.exports = {
    isStringValid,
    isEmailValid,
}
