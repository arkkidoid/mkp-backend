/**
 * Standardized API Response helper
 */
class ApiResponse {
  /**
   * Success response
   */
  static success(res, { data = null, message = 'Success', statusCode = 200, meta = null }) {
    const response = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Created response (201)
   */
  static created(res, { data = null, message = 'Resource created successfully' }) {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Paginated response
   */
  static paginated(res, { data, page, limit, total, message = 'Success' }) {
    return res.status(200).json({
      success: true,
      message,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
