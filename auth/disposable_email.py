"""Block registration from known disposable/temporary email domains."""

import pathlib

_BLOCKLIST_FILE = pathlib.Path(__file__).parent / "disposable_domains.txt"

_BLOCKED_DOMAINS: frozenset[str] = frozenset()


def _load_domains() -> frozenset[str]:
    global _BLOCKED_DOMAINS
    if _BLOCKED_DOMAINS:
        return _BLOCKED_DOMAINS
    with open(_BLOCKLIST_FILE) as f:
        _BLOCKED_DOMAINS = frozenset(
            line.strip().lower() for line in f if line.strip() and not line.startswith("#")
        )
    return _BLOCKED_DOMAINS


def is_disposable_email(email: str) -> bool:
    """Return True if the email uses a known disposable domain."""
    domain = email.rsplit("@", 1)[-1].lower()
    return domain in _load_domains()
