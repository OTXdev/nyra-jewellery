from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to always return a consistent
    { "detail": ..., "errors": ... } shape for error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data
        if isinstance(data, dict) and "detail" in data and len(data) == 1:
            response.data = {"detail": data["detail"]}
        else:
            response.data = {"detail": "Validation error.", "errors": data}

    return response
