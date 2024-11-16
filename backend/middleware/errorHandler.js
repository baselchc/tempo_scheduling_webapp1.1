const errorHandler = (err, req, res, next) => {
    // Log the error with timestamp and request details
    console.error('Error occurred at:', new Date().toISOString());
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
    console.error('Error:', err);
  
    // Handle connection reset errors
    if (err.code === 'ECONNRESET') {
      return res.status(500).json({
        error: 'Connection reset by peer',
        message: 'Please try your request again'
      });
    }
  
    // Handle database connection errors
    if (err.code === '08006' || err.code === '08001' || err.code === '57P01') {
      return res.status(503).json({
        error: 'Database connection error',
        message: 'Service temporarily unavailable'
      });
    }
  
    // Handle timeout errors
    if (err.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'The request took too long to process'
      });
    }
  
    // Handle specific SQL errors
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'A resource with that identifier already exists'
      });
    }
  
    if (err.code === '23503') { // Foreign key violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'This operation violates database constraints'
      });
    }
  
    // Default error response
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
  };
  
  module.exports = errorHandler;