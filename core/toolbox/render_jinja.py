from jinja2 import Environment, FileSystemLoader
from pathlib import Path

func_dict = {
    # 'text_to_md': text_to_md,
}

def render_jinja(folder_path_source: Path, folder_path_target: Path,
                 file_name_source: str, file_name_target: str | None,
                 key_value: dict):

    environment = Environment(loader=FileSystemLoader(f'{folder_path_source}'))
    template = environment.get_template(f'{file_name_source}')
    template.globals.update(func_dict)
    file_rendered = template.render(key_value)

    if file_name_target is not None:
        with open(f'{folder_path_target}/{file_name_target}', mode='w', encoding='utf-8') as file:
            file.write(file_rendered)

    return file_rendered


if __name__ == '__main__':
    key_value = {'key': 'value'}
    folder_source = Path(__file__).resolve().parents[0] / 'debug'
    folder_target = Path(__file__).resolve().parents[0] / 'debug'
    file_name_source = 'dummy.j2'
    file_name_target = 'dummy.md'

    render_jinja(folder_source, folder_target, file_name_source, file_name_target, key_value)



# https://ttl255.com/jinja2-tutorial-part-1-introduction-and-variable-substitution/
# https://saidvandeklundert.net/2020-12-24-python-functions-in-jinja/
# https://realpython.com/primer-on-jinja-templating/
