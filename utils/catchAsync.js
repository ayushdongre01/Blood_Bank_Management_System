// Wrapping async functions to handle errors gracefully in middleware
module.exports = func => {
    return (req, res, next) => {
        // Call the passed function and catch any errors to pass to the next middleware
        func(req, res, next).catch(next);  // Forward errors to the default error handler
    }
}
