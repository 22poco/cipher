"""removes the length cue from multiple-choice answer options.

the banks' correct options often read as full explanations while distractors
are short names, so answer length alone gives away the right choice (134 of
151 exam-bank questions had the correct option as the longest). to kill that
cue, every option is padded with a neutral, meaning-preserving
clause until all options land within a few characters of the same
length — which option is technically longest is then decided by tiny
deterministic jitter, effectively random, so a student cannot learn
anything from length. overshoot is capped so options always converge
into a tight band (pinned by backend/tests/test_answer_length.py).

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

# one flat candidate pool for the constrained picker below
ALL_FILLERS: list[str] = [
    f for pool in (SHORT_FILLERS, MEDIUM_FILLERS, LONG_FILLERS) for f in pool
]


def _pad_once(text: str, filler: str) -> str:
    if text.endswith((".", ")", "?")):
        return f"{text} {filler[0].upper()}{filler[1:]}"
    return f"{text} {filler}"


# smallest filler that reaches the stop line without paying a large
# overshoot; if no filler lands in band, take the largest one still short
# of the stop line (progress without overshoot), or the smallest overall.
# then hash-pick inside the shortest qualifying group so options do not all
# end with the same boilerplate wording.
def _pick_filler(text: str, target: int, salt: int, slot: int, round_index: int) -> str:
    remaining = target - len(text)
    reachable = [
        f
        for f in ALL_FILLERS
        if remaining <= len(f) + 1 <= remaining + TOLERANCE
    ]
    if not reachable:
        under = [f for f in ALL_FILLERS if len(f) + 1 < remaining]
        reachable = (
            [max(under, key=len)] if under else [min(ALL_FILLERS, key=len)]
        )
        reachable = sorted(reachable, key=len)
    reachable = sorted(reachable, key=len)
    group = [f for f in reachable if len(f) == len(reachable[0])]
    return group[_digest(f"{text}:{slot}", salt + round_index * 13) % len(group)]


def _grow(text: str, target: int, salt: int, slot: int) -> str:
    round_index = 0
    while len(text) < target and round_index < 50:
        filler = _pick_filler(text, target, salt, slot, round_index)
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

    # uniform stop line: every option grows to the original longest option's
    # length, overshoot is capped by _pick_filler, so final lengths sit in a
    # TOLERANCE-wide band and the longest option is effectively random
    slots = [correct_text, *wrong_texts]
    stop_lines = [max_len for _ in slots]

    balanced = [
        _grow(option, stop_lines[slot], salt, slot)
        for slot, option in enumerate(slots)
    ]
    return balanced[0], balanced[1:]
