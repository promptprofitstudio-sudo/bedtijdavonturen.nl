import random


def generate_story(child_name: str, interests: list, language: str = 'nl') -> str:
    """
    Generate a simple personalized bedtime story using a grammar-based approach.

    Args:
        child_name (str): Name of the child.
        interests (list): List of interests (e.g. ["dino's", "ruimte"])
        language (str): 'nl' for Dutch or 'en' for English.

    Returns:
        str: The personalized story.
    """
    # Basic story components
    random.shuffle(interests)
    # Use first interest as theme, rest as side themes
    main_interest = interests[0] if interests else 'avonturen'
    other = interests[1:] if len(interests) > 1 else []

    if language.lower().startswith('nl'):
        intro_templates = [
            f"Er was eens een kind genaamd {child_name} die dol was op {main_interest}.",
            f"Op een dag ontdekte {child_name} een magische wereld vol {main_interest}.",
            f"{child_name} keek uit het raam en droomde over {main_interest}."
        ]
        adventure_templates = [
            f"Samen met een vriendelijke gids begon {child_name} aan een spannend avontuur.",
            f"Onderweg ontmoette {child_name} bijzondere vrienden die hielpen bij het ontdekken van nieuwe dingen.",
            f"Elke stap bracht {child_name} dichter bij een geheim dat lang verborgen was."
        ]
        theme_templates = [
            f"In de wereld van {main_interest} waren er {', '.join(other) if other else 'magische' } wezens die graag wilden spelen.",
            f"De lucht was gevuld met {main_interest}, en zelfs de bomen fluisterden verhalen over vriendschap.",
            f"{child_name} leerde dat moed en nieuwsgierigheid belangrijke eigenschappen zijn in het land van {main_interest}."
        ]
        ending_templates = [
            f"Na een dag vol ontdekkingen keerde {child_name} terug naar huis, dankbaar voor de nieuwe vrienden en ervaringen.",
            f"Toen de sterren straalden, wist {child_name} dat het volgende avontuur wachtte in de dromen van die nacht.",
            f"En ze leefden nog lang en gelukkig, wetende dat de wereld van {main_interest} altijd openstond voor avonturiers."
        ]
    else:  # English version
        intro_templates = [
            f"Once upon a time there was a child named {child_name} who loved {main_interest}.",
            f"One day, {child_name} discovered a magical world full of {main_interest}.",
            f"{child_name} looked out the window and dreamed about {main_interest}."
        ]
        adventure_templates = [
            f"Together with a friendly guide, {child_name} began an exciting adventure.",
            f"Along the way, {child_name} met unique friends who helped discover new things.",
            f"Every step brought {child_name} closer to a secret long hidden."
        ]
        theme_templates = [
            f"In the world of {main_interest}, there were {', '.join(other) if other else 'magical'} creatures that loved to play.",
            f"The sky was filled with {main_interest}, and even the trees whispered stories about friendship.",
            f"{child_name} learned that courage and curiosity are important traits in the land of {main_interest}."
        ]
        ending_templates = [
            f"After a day full of discoveries, {child_name} returned home, grateful for the new friends and experiences.",
            f"As the stars shone, {child_name} knew the next adventure awaited in the dreams of the night.",
            f"And they lived happily ever after, knowing the world of {main_interest} would always be open to adventurers."
        ]

    story = "\n".join([
        random.choice(intro_templates),
        random.choice(adventure_templates),
        random.choice(theme_templates),
        random.choice(ending_templates)
    ])
    return story


if __name__ == "__main__":
    # Example usage
    name = input("Naam van het kind: ")
    interests = input("Interesses (gescheiden door komma's): ").split(',')
    language = input("Taal (nl/en): ") or 'nl'
    story = generate_story(name.strip(), [i.strip() for i in interests if i.strip()], language)
    print("\n--- Verhaaltje ---\n")
    print(story)
