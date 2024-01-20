/**
 * This function is a utility that delays execution for a given number of milliseconds.
 *
 * @param {number} ms - The duration in milliseconds for which the function should pause execution.
 * @returns {Promise} A promise that resolves after the specified duration.
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
