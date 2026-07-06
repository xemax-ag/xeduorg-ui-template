import deepl
from enum import StrEnum
from pathlib import Path
import sys

__cwd__ = str(Path(__file__).parents[2]).replace('\\', '/')
sys.path.append(__cwd__)

from core.config import config


class Language(StrEnum):
    DE = 'de'
    FR = 'fr'
    IT = 'it'
    EN = 'en'


def translator(text: str, source: Language, target: Language) -> str:
    translator: deepl.Translator = deepl.Translator(
        auth_key=config.deepl_auth_key, server_url='https://api.deepl.com'
    )

    result = translator.translate_text(
        text=text,
        source_lang=source.value,
        target_lang='en-gb' if target == Language.EN else target.value,
        formality=deepl.Formality.DEFAULT,
        tag_handling=None,
    )
    return str(result)

if __name__ == "__main__":
    print(translator(text='Guten Morgen', source=Language.DE, target=Language.FR))
    print(translator(text='Guten Morgen', source=Language.DE, target=Language.IT))
    print(translator(text='Guten Morgen', source=Language.DE, target=Language.EN))

"""
    usage: deepl.Usage = translator.get_usage()
    print(usage.any_limit_reached)
    print(usage.character.count)
"""