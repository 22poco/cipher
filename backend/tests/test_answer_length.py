"""tests for the answer-length balancer.

these pin the core anti-cheat guarantee: after balancing, no option's length
gives away (or mutes) the correct answer, every returned option still contains
its original wording, and the result is deterministic across calls so seed
reruns do not reshuffle stored answers.
"""

from backend.answer_length import balance_option_lengths

CASES = [
    # the shape that started it: long correct option, short distractors
    {
        "question": "which finding should be documented as the highest risk?",
        "correct": "open network ports on the internal staff network that could enable device spoofing",
        "wrong": ["guest wi-fi coverage", "feedback tablets", "printer firmware visible"],
    },
    # short correct option, longer distractors — the inverse shape
    {
        "question": "which command sets these permissions?",
        "correct": "chmod 640 Oak_Park_HS",
        "wrong": [
            "chmod 444 Oak_Park_HS because read-only access suffices for the staff group",
            "chmod 740 Oak_Park_HS grants the group write access it should not have",
            "chmod 777 Oak_Park_HS leaves the file world-writable and wide open",
        ],
    },
    # all options already similar length — should stay essentially untouched
    {
        "question": "two hashing functions are run on four files.",
        "correct": "file1.txt and file3.txt produce a collision under function 2",
        "wrong": ["file1.txt and file3.txt are exact copies", "function 1 is more secure", "function 1 and 2 are the same"],
    },
    # option that already ends with punctuation
    {
        "question": "which access control model best matches this request?",
        "correct": "rule-based access control, because access decisions follow configured conditions.",
        "wrong": ["dac: owner-managed.", "mac: label-driven.", "rbac: role-assigned."],
    },
]


def test_no_length_tell_after_balancing():
    for case in CASES:
        correct, wrongs = balance_option_lengths(case["correct"], case["wrong"], case["question"])
        lengths = [len(correct), *(len(w) for w in wrongs)]
        correct_is_longest = all(len(correct) >= l for l in lengths[1:])
        correct_is_shortest = all(len(correct) <= l for l in lengths[1:])
        # within a small tolerance the correct option must not be reliably
        # the longest or reliably the shortest — that is the whole point
        assert not correct_is_longest or max(lengths) - min(lengths) <= 12
        assert not correct_is_shortest or max(lengths) - min(lengths) <= 12


def test_options_are_balanced_within_tolerance():
    for case in CASES:
        correct, wrongs = balance_option_lengths(case["correct"], case["wrong"], case["question"])
        lengths = [len(correct), *(len(w) for w in wrongs)]
        assert max(lengths) - min(lengths) <= 24, (
            f"options differ by more than the jitter band: {lengths}"
        )


def test_original_wording_is_preserved():
    for case in CASES:
        correct, wrongs = balance_option_lengths(case["correct"], case["wrong"], case["question"])
        for original, balanced in [
            (case["correct"], correct),
            *zip(case["wrong"], wrongs),
        ]:
            assert balanced.startswith(original), (
                f"wording inside the option changed: {original!r} -> {balanced!r}"
            )


def test_result_is_deterministic():
    case = CASES[0]
    first = balance_option_lengths(case["correct"], case["wrong"], case["question"])
    second = balance_option_lengths(case["correct"], case["wrong"], case["question"])
    assert first == second


def test_degenerate_inputs_pass_through():
    # fewer than two distractors: nothing to balance
    correct, wrongs = balance_option_lengths("answer", ["only one distractor"], "q?")
    assert correct == "answer"
    assert wrongs == ["only one distractor"]

    # empty correct option: passthrough, no crash
    correct, wrongs = balance_option_lengths("", ["a", "b", "c"], "q?")
    assert correct == ""
    assert wrongs == ["a", "b", "c"]


def test_full_bank_has_no_detectable_length_tell():
    """the guarantee over the real exam bank: no question where the correct
    option is strictly the longest by more than the jitter band."""
    from backend.exam_bank import MCQ_BANK as EXAM_BANK

    offenders = []
    for question in EXAM_BANK:
        correct, wrongs = balance_option_lengths(
            question["correct"], question["wrong"], question["question_text"]
        )
        lengths = [len(correct), *(len(w) for w in wrongs)]
        if len(correct) == max(lengths) and len(correct) - min(lengths) > 12:
            offenders.append(question["question_text"][:60])

    assert not offenders, f"length tell survives after balancing for: {offenders}"
