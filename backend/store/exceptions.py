from rest_framework.exceptions import Throttled
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None and not isinstance(exc, Throttled):
        data = response.data
        if isinstance(data, dict) and "detail" in data and len(data) == 1:
            response.data = {"detail": data["detail"]}
        else:
            response.data = {"detail": "Validation error.", "errors": data}

    return response
