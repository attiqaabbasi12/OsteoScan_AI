# ─────────────────────────────────────────────────────────────
# QUESTION ENGINE
# Pure Python — no ML, no API
# Questions are class-specific and clinically grounded
# ─────────────────────────────────────────────────────────────

# ── Question Banks ────────────────────────────────────────────

QUESTIONS = {

    'Normal': [
        {
            'id'      : 'n1',
            'question': 'Do you experience any bone or joint pain?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': -2, 'No': +2}
        },
        {
            'id'      : 'n2',
            'question': 'Have you had any fractures in the last 2 years?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': -2, 'No': +2}
        },
        {
            'id'      : 'n3',
            'question': 'Are you above 50 years of age?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': -1, 'No': +1}
        },
        {
            'id'      : 'n4',
            'question': 'Do you have a family history of bone disease or osteoporosis?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': -1, 'No': +1}
        },
        {
            'id'      : 'n5',
            'question': 'Is your calcium and vitamin D intake adequate (dairy, supplements)?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': -1}
        },
    ],

    'Osteopenia': [
        {
            'id'      : 'op1',
            'question': 'Do you experience mild joint stiffness or bone aches?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': -1}
        },
        {
            'id'      : 'op2',
            'question': 'Are you between 45 and 65 years of age?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': 0}
        },
        {
            'id'      : 'op3',
            'question': 'Are you postmenopausal? (For female patients — select No if male)',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': 0}
        },
        {
            'id'      : 'op4',
            'question': 'Is your calcium intake low (limited dairy, leafy greens)?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': -1}
        },
        {
            'id'      : 'op5',
            'question': 'Do you have a sedentary lifestyle with little physical activity?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +1, 'No': -1}
        },
        {
            'id'      : 'op6',
            'question': 'Do you have a family history of osteoporosis?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': 0}
        },
        {
            'id'      : 'op7',
            'question': 'Do you smoke or consume alcohol regularly?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +1, 'No': 0}
        },
    ],

    'Osteoporosis': [
        {
            'id'      : 'os1',
            'question': 'Have you had fractures from minor falls or small impacts?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +3, 'No': -1}
        },
        {
            'id'      : 'os2',
            'question': 'Do you experience regular back or hip pain?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': -1}
        },
        {
            'id'      : 'os3',
            'question': 'Are you above 65 years of age?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +3, 'No': 0}
        },
        {
            'id'      : 'os4',
            'question': 'Are you currently on corticosteroid medications (e.g. Prednisolone)?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +3, 'No': 0}
        },
        {
            'id'      : 'os5',
            'question': 'Have you noticed a loss in height over the years?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': 0}
        },
        {
            'id'      : 'os6',
            'question': 'Do you have rheumatoid arthritis or thyroid issues?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': 0}
        },
        {
            'id'      : 'os7',
            'question': 'Is your physical activity very low or are you mostly bedridden?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +2, 'No': -1}
        },
        {
            'id'      : 'os8',
            'question': 'Do you smoke or drink alcohol heavily?',
            'options' : ['Yes', 'No'],
            'scores'  : {'Yes': +1, 'No': 0}
        },
    ],
}

# ── Thresholds ────────────────────────────────────────────────

THRESHOLDS = {
    'Normal'       : 4,
    'Osteopenia'   : 6,
    'Osteoporosis' : 10,
}

MAX_SCORES = {
    'Normal'       : 8,
    'Osteopenia'   : 12,
    'Osteoporosis' : 18,
}


# ─────────────────────────────────────────────────────────────
# PUBLIC FUNCTIONS
# ─────────────────────────────────────────────────────────────

def get_questions(xray_class: str) -> list:
    """Return question bank for given class."""
    return QUESTIONS.get(xray_class, [])


def calculate_score(xray_class: str, answers: dict) -> dict:
    """
    Calculate score from answers.

    answers = {
        'n1': 'Yes',
        'n2': 'No',
        ...
    }

    Returns:
    {
        'score'    : 5,
        'max_score': 8,
        'threshold': 4,
        'confirmed': True,
        'outcome'  : 'Confirmed'
    }
    """
    questions  = QUESTIONS.get(xray_class, [])
    threshold  = THRESHOLDS.get(xray_class, 0)
    max_score  = MAX_SCORES.get(xray_class, 0)

    total_score = 0

    for q in questions:
        answer = answers.get(q['id'])
        if answer and answer in q['scores']:
            total_score += q['scores'][answer]

    confirmed = total_score >= threshold

    return {
        'score'    : total_score,
        'max_score': max_score,
        'threshold': threshold,
        'confirmed': confirmed,
        'outcome'  : 'Confirmed' if confirmed else 'DEXA Recommended'
    }
