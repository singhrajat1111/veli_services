ALLERGEN_CATEGORY_MAP = {
    "dairy": ["dairy"],
    "gluten": ["bakery"],
    "nuts": ["pantry"],
    "seafood": ["meat"],
    "eggs": ["meat"],
}

ALLERGEN_FEATURE_KEYWORDS = {
    "dairy": ["milk", "dairy", "lactose", "cheese", "butter", "cream"],
    "gluten": ["gluten", "wheat", "barley", "rye"],
    "nuts": ["nuts", "peanut", "almond", "cashew", "walnut", "pistachio"],
    "seafood": ["fish", "seafood", "shrimp", "prawn", "crab", "lobster"],
    "eggs": ["egg", "eggs"],
}

CUISINE_CATEGORY_MAP = {
    "indian": {
        "boost": ["spices", "pantry", "instant", "dairy", "snacks", "fresh", "bakery"],
        "neutral": ["beverages", "nourish", "frozen"],
        "suppress": [],
    },
    "chinese": {
        "boost": ["instant", "fresh", "meat", "pantry", "frozen"],
        "neutral": ["beverages", "snacks", "dairy"],
        "suppress": [],
    },
    "italian": {
        "boost": ["bakery", "dairy", "fresh", "pantry", "meat"],
        "neutral": ["beverages", "snacks", "frozen"],
        "suppress": [],
    },
    "mexican": {
        "boost": ["fresh", "meat", "snacks", "pantry", "spices"],
        "neutral": ["beverages", "dairy", "frozen"],
        "suppress": [],
    },
    "arabic": {
        "boost": ["meat", "dairy", "spices", "bakery", "fresh"],
        "neutral": ["beverages", "instant", "frozen"],
        "suppress": [],
    },
    "thai": {
        "boost": ["fresh", "meat", "instant", "spices", "pantry"],
        "neutral": ["beverages", "snacks", "frozen"],
        "suppress": [],
    },
    "continental": {
        "boost": ["dairy", "meat", "bakery", "fresh", "beverages"],
        "neutral": ["snacks", "frozen", "instant"],
        "suppress": [],
    },
    "_default": {
        "boost": ["fresh", "pantry", "snacks", "beverages"],
        "neutral": ["dairy", "meat", "bakery", "instant", "frozen", "nourish", "spices"],
        "suppress": [],
    },
}

LIFESTYLE_RULES = {
    "vegan": {
        "boost": ["fresh", "pantry", "beverages", "snacks", "nourish", "spices"],
        "suppress": ["meat", "dairy"],
    },
    "vegetarian": {
        "boost": ["fresh", "dairy", "pantry", "bakery", "snacks", "beverages", "nourish"],
        "suppress": ["meat"],
    },
    "gluten-free": {
        "boost": ["fresh", "meat", "dairy", "nourish", "beverages"],
        "suppress": ["bakery"],
    },
    "paleo": {
        "boost": ["meat", "fresh", "pantry"],
        "suppress": ["instant", "bakery", "frozen", "snacks"],
    },
    "keto": {
        "boost": ["meat", "dairy", "fresh"],
        "suppress": ["bakery", "instant", "snacks", "pantry"],
    },
    "halal": {
        "boost": ["meat", "dairy", "fresh", "pantry", "bakery"],
        "suppress": [],
    },
    "low-sugar": {
        "boost": ["fresh", "meat", "dairy"],
        "suppress": ["snacks", "bakery", "beverages", "frozen"],
    },
    "_default": {
        "boost": [],
        "suppress": [],
    },
}
