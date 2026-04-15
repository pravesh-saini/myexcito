import time

from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response


def get_client_ip(request):
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return (request.META.get('REMOTE_ADDR') or 'unknown').strip()


def _normalize_identifier(value):
    normalized = (value or '').strip().lower()
    return normalized or 'anonymous'


def _hit_rate_limit(prefix, identifier, limit, window_seconds):
    if limit <= 0 or window_seconds <= 0:
        return False, 0

    now = time.time()
    bucket = int(now // window_seconds)
    cache_key = f'rl:{prefix}:{_normalize_identifier(identifier)}:{bucket}'

    if cache.add(cache_key, 1, timeout=window_seconds):
        count = 1
    else:
        try:
            count = cache.incr(cache_key)
        except ValueError:
            cache.set(cache_key, 1, timeout=window_seconds)
            count = 1

    if count <= limit:
        return False, 0

    retry_after = int(window_seconds - (now % window_seconds))
    return True, max(retry_after, 1)


def throttle_response(detail, retry_after_seconds):
    response = Response(
        {
            'detail': detail,
            'retry_after_seconds': retry_after_seconds,
        },
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )
    response['Retry-After'] = str(retry_after_seconds)
    return response


def apply_rate_limits(rules):
    for rule in rules:
        exceeded, retry_after = _hit_rate_limit(
            prefix=rule['prefix'],
            identifier=rule.get('identifier', ''),
            limit=int(rule['limit']),
            window_seconds=int(rule['window_seconds']),
        )
        if exceeded:
            return throttle_response(rule['detail'], retry_after)

    return None