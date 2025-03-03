import yaml

class PromptManager:
    def __init__(self, PATH_PROMPTS):
        with open(PATH_PROMPTS, encoding='utf-8') as file:
            self.prompts = yaml.safe_load(file)

    def get_prompt(self, prompt_name):
        return self.prompts['prompts'][prompt_name]['template']

    def format_prompt(self, prompt_name, variables):
        prompt_template = self.get_prompt(prompt_name)
        if prompt_template:
            return prompt_template.format(**variables)
        return None