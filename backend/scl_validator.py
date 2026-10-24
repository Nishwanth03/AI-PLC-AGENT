
import re


def validate_scl(code: str) -> dict:
    """
    Perform basic structural checks on SCL source.
    This is not a Siemens compiler or full syntax validator.
    """

    if not isinstance(code, str) or not code.strip():
        return {
            "valid": False,
            "errors": ["SCL code is empty."],
            "warnings": [],
        }

    errors = []
    warnings = []

    # Remove single-line comments and quoted strings before
    # checking structural keywords.
    cleaned = re.sub(r"//[^\n]*", "", code)
    cleaned = re.sub(r"\(\*.*?\*\)", "", cleaned, flags=re.S)
    cleaned = re.sub(r'"(?:[^"]|"")*"', '""', cleaned)

    # Check common block declarations and endings.
    has_block_start = re.search(
        r"\b(FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK)\b",
        cleaned,
        re.IGNORECASE,
    )
    has_block_end = re.search(
        r"\bEND_(FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK)\b",
        cleaned,
        re.IGNORECASE,
    )

    if not has_block_start:
        errors.append("No supported block declaration was found.")

    if not has_block_end:
        errors.append("No matching block ending was found.")

    # Check common structured statements.
    pairs = [
        ("IF", "END_IF"),
        ("CASE", "END_CASE"),
        ("FOR", "END_FOR"),
        ("WHILE", "END_WHILE"),
        ("REPEAT", "UNTIL"),
    ]

    for start, end in pairs:
        starts = len(
            re.findall(rf"\b{start}\b", cleaned, re.IGNORECASE)
        )
        ends = len(
            re.findall(rf"\b{end}\b", cleaned, re.IGNORECASE)
        )

        if starts != ends:
            errors.append(
                f"{start}/{end} count mismatch: "
                f"found {starts} start(s) and {ends} ending(s)."
            )

    # Check parentheses balance.
    depth = 0

    for char in cleaned:
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1

        if depth < 0:
            errors.append("A closing parenthesis appears before its opening.")
            break

    if depth > 0:
        errors.append("One or more opening parentheses are not closed.")

    # Basic warning for unfinished placeholders.
    if re.search(r"\b(TODO|FIXME|PLACEHOLDER)\b", code, re.IGNORECASE):
        warnings.append("The source contains unfinished placeholders.")

    if "END_VAR" not in cleaned.upper():
        warnings.append(
            "No END_VAR declaration found; confirm the block interface."
        )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }
