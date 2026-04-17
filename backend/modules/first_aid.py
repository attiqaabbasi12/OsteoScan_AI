# ─────────────────────────────────────────────────────────────
# FIRST AID MODULE
# Rule-based advice mapped to each confirmed class
# ─────────────────────────────────────────────────────────────

FIRST_AID = {

    'Normal': {
        'status' : 'normal',
        'title'  : 'Your bone density appears normal.',
        'summary': 'Good news — your X-ray shows no signs of bone density loss. '
                   'Follow these preventive measures to maintain strong bones.',
        'steps'  : [
            {
                'category': 'Nutrition',
                'icon'    : '🥛',
                'advice'  : [
                    'Maintain calcium intake of 1000mg per day',
                    'Ensure adequate Vitamin D intake (600 IU/day)',
                    'Include dairy products, leafy greens, and fortified foods in diet',
                ]
            },
            {
                'category': 'Exercise',
                'icon'    : '🏃',
                'advice'  : [
                    'Perform weight-bearing exercise for at least 30 minutes daily',
                    'Include balance exercises such as yoga or tai chi',
                    'Avoid prolonged periods of inactivity',
                ]
            },
            {
                'category': 'Lifestyle',
                'icon'    : '🚭',
                'advice'  : [
                    'Avoid smoking — it accelerates bone loss',
                    'Limit alcohol consumption',
                    'Maintain a healthy body weight',
                ]
            },
            {
                'category': 'Monitoring',
                'icon'    : '📅',
                'advice'  : [
                    'Schedule a bone density check every 2 years if you are above 50',
                    'Discuss DEXA scan timing with your doctor based on risk factors',
                ]
            },
        ],
        'urgent' : False,
    },

    'Osteopenia': {
        'status' : 'warning',
        'title'  : 'Early bone density loss detected — Osteopenia.',
        'summary': 'Your X-ray indicates low bone density (Osteopenia). '
                   'This is an early warning stage. Immediate lifestyle changes '
                   'can slow or reverse bone loss.',
        'steps'  : [
            {
                'category': 'Nutrition',
                'icon'    : '🥛',
                'advice'  : [
                    'Increase calcium intake to 1200mg per day',
                    'Take Vitamin D supplement 800 IU per day',
                    'Eat dairy products — milk, yogurt, cheese daily',
                    'Include leafy greens — spinach, kale, broccoli',
                    'Eat fortified foods — orange juice, cereals',
                ]
            },
            {
                'category': 'Exercise',
                'icon'    : '🏋️',
                'advice'  : [
                    'Start weight-bearing exercises — walking, jogging, dancing',
                    'Begin light resistance training to strengthen bones',
                    'Perform balance exercises to reduce fall risk',
                    'Exercise at least 30-45 minutes, 5 days a week',
                ]
            },
            {
                'category': 'Lifestyle',
                'icon'    : '🚭',
                'advice'  : [
                    'Stop smoking immediately — it directly causes bone loss',
                    'Reduce or eliminate alcohol consumption',
                    'Maintain a healthy body weight',
                    'Get adequate sunlight for natural Vitamin D',
                ]
            },
            {
                'category': 'Medical',
                'icon'    : '🏥',
                'advice'  : [
                    'Consult your doctor for FRAX fracture risk assessment',
                    'Schedule a DEXA scan to measure bone density accurately',
                    'Discuss whether medication is needed with your orthopedic doctor',
                    'Get blood tests to check calcium and Vitamin D levels',
                ]
            },
        ],
        'urgent' : False,
    },

    'Osteoporosis': {
        'status' : 'critical',
        'title'  : 'Severe bone density loss detected — Osteoporosis.',
        'summary': 'Your X-ray indicates significant bone density loss (Osteoporosis). '
                   'Immediate medical attention is required. Follow these steps urgently.',
        'steps'  : [
            {
                'category': 'URGENT — See a Doctor',
                'icon'    : '🚨',
                'advice'  : [
                    'Consult an orthopedic specialist IMMEDIATELY',
                    'Do NOT delay medical evaluation',
                    'Ask your doctor about bisphosphonate therapy',
                    'Request a DEXA scan for baseline bone density measurement',
                    'Get bone turnover marker blood tests',
                ]
            },
            {
                'category': 'Fall Prevention',
                'icon'    : '🏠',
                'advice'  : [
                    'Remove rugs and loose carpets from your home',
                    'Install grab bars in bathroom and near stairs',
                    'Improve lighting in all rooms especially at night',
                    'Wear non-slip footwear at all times',
                    'Avoid climbing ladders or standing on chairs',
                    'Do NOT lift heavy objects',
                ]
            },
            {
                'category': 'Nutrition',
                'icon'    : '🥛',
                'advice'  : [
                    'Calcium supplement 1200mg every day without fail',
                    'Vitamin D supplement 1000 IU every day',
                    'Protein-rich diet to support bone and muscle health',
                    'Avoid excessive salt and caffeine — they increase calcium loss',
                ]
            },
            {
                'category': 'Lifestyle',
                'icon'    : '🚭',
                'advice'  : [
                    'Stop smoking immediately and completely',
                    'Avoid alcohol entirely',
                    'Stay as active as safely possible',
                ]
            },
            {
                'category': 'Safe Exercise',
                'icon'    : '🚶',
                'advice'  : [
                    'Gentle walking only — with doctor approval',
                    'Balance and posture exercises to reduce fall risk',
                    'NO high-impact activities — no running, jumping',
                    'NO heavy resistance training without medical clearance',
                    'Consider physiotherapy for a safe exercise plan',
                ]
            },
        ],
        'urgent' : True,
    },
}

DEXA_RECOMMENDATION = {
    'title'  : 'DEXA Scan Recommended',
    'message': (
        'The patient\'s reported symptoms do not strongly correlate '
        'with the X-ray finding. For a definitive diagnosis, please:'
    ),
    'steps'  : [
        'Refer the patient for a DEXA (Dual-Energy X-ray Absorptiometry) scan',
        'Consult an orthopedic specialist for clinical evaluation',
        'A DEXA scan will provide an accurate T-score for definitive diagnosis',
        'Do not start any medication without formal diagnosis',
    ]
}


def get_first_aid(xray_class: str) -> dict:
    """Return first aid advice for confirmed class."""
    return FIRST_AID.get(xray_class, {})


def get_dexa_recommendation() -> dict:
    """Return DEXA recommendation for inconclusive cases."""
    return DEXA_RECOMMENDATION
