// backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  // Log the error with timestamp and request details
  console.error('Error occurred at:', new Date().toISOString());
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Error:', err);

  // Handle Supabase connection errors
  if (err.statusCode === 503) {
    return res.status(503).json({
      error: 'Database service error',
      message: 'Service temporarily unavailable'
    });
  }

  // Handle timeout errors
  if (err.statusCode === 504) {
    return res.status(504).json({
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  }

  // Handle Supabase specific errors
  if (err.code === 'PGRST301') { // Foreign key violation
    return res.status(409).json({
      error: 'Conflict',
      message: 'This operation violates database constraints'
    });
  }

  if (err.code === 'PGRST204') { // Unique violation
    return res.status(409).json({
      error: 'Conflict',
      message: 'A resource with that identifier already exists'
    });
  }

  // Handle authentication errors
  if (err.status === 401 || err.statusCode === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 
      'An unexpected error occurred' : 
      err.message
  });
};

module.exports = errorHandler;