function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const response = {
    error: err.message || 'Internal Server Error',
  };
  if (err.code) response.code = err.code;
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }
  res.status(status).json(response);
}

module.exports = { errorHandler }; 