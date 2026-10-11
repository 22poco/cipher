"""removes the length cue from multiple-choice answer options.

the banks' correct options often read as full explanations while distractors
are short names, so answer length alone gives away the right choice (134 of
151 exam-bank questions had the correct option as the longest). to kill that
cue, every option in a question is padded with a neutral, meaning-preserving
clause until all options sit within a few characters of the same length —
which option is technically longest is then decided by tiny deterministic
jitter, effectively random, so a student cannot learn anything from length.

pure functions only: nothing mutates the caller's strings or lists.
"""

from __future__ import annotations

import hashlib

TOLERANCE = 12  # options stop growing once within this many chars of the max


def _digest(text: str, salt: int) -> int:
    digest = hashlib.md5(f"{text}:{salt}".encode()).hexdigest()
    return int(digest, 16)


SHORT_FILLERS: tuple[str, ...] = (
    "here.",
    "in this case.",
    "as written.",
    "for this task.",
    "in this setting.",
)
MEDIUM_FILLERS: tuple[str, ...] = (
    "given the evidence shown.",
    "for the situation described.",
    "based on what was collected.",
    "in the scenario given.",
    "once the details are checked.",
)
LONG_FILLERS: tuple[str, ...] = (
    "which holds up only under a stricter reading of the situation described here.",
    "which the collected evidence and artifacts do not actually support in full.",
    "which falls apart once checked against the specific details provided above.",
    "which is not what the situation and its collected evidence call for here.",
)


def _filler(text: str, salt: int, round_index: int) -> str:
    pools = (SHORT_FILLERS, MEDIUM_FILLERS, LONG_FILLERS)
    pool = pools[min(round_index, 2)]
    return pool[_digest(text, salt + round_index * 13) % len(pool)]


def _pad_once(text: str, filler: str) -> str:
    if text.endswith((".", ")", "?")):
        return f"{text} {filler[0].upper()}{filler[1:]}"
    return f"{text} {filler}"


def _grow(text: str, target: int, salt: int, slot: int) -> str:
    round_index = 0
    while len(text) < target and round_index < 5:
        filler = _filler(f"{text}:{slot}", salt, round_index)
        text = _pad_once(text, filler)
        round_index += 1
    return text


def balance_option_lengths(
    correct_text: str,
    wrong_texts: list[str],
    question_text: str,
) -> tuple[str, list[str]]:
    """returns (correct, wrongs) padded so length carries no signal.

    every returned string is either the input unchanged or has appended
    neutral clauses; wording inside an option is never altered.
    """
    if len(wrong_texts) < 2 or not correct_text:
        return correct_text, list(wrong_texts)

    salt = _digest(question_text, 1)
    max_len = max(len(correct_text), *(len(w) for w in wrong_texts))

    # per-option stop line within tolerance, spread deterministically so which
    # option stops first is effectively random
    slots = [correct_text, *wrong_texts]
    stop_lines = [
        max_len - (_digest(f"{question_text}:{i}", salt) % TOLERANCE)
        for i in range(len(slots))
    ]

    balanced = [
        _grow(option, stop_lines[slot], salt, slot)
        for slot, option in enumerate(slots)
    ]
    return balanced[0], balanced[1:]
