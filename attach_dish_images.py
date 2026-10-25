"""
Attach images from the assets folder to dishes whose names match the file names.

Usage (run from the folder that contains manage.py):
    python manage.py attach_dish_images --dry-run    # preview matches, saves nothing
    python manage.py attach_dish_images              # copy images and link them to dishes
    python manage.py attach_dish_images --source "D:/my/pictures"   # optional custom folder

Matching ignores case, spaces, underscores and hyphens, so
"BEEF_GRAVY.jpeg" matches a dish named "Beef Gravy".
"""
import re
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from orders.models import Dish

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}


def match_key(text):
    return re.sub(r'[^A-Z0-9]', '', text.upper())


class Command(BaseCommand):
    help = 'Attach images from the assets folder to dishes whose names match the file names.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source', default=None,
            help='Folder containing the images (default: <project>/assets)',
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Only show what would be matched; do not copy or save anything.',
        )

    def handle(self, *args, **options):
        source = Path(options['source']) if options['source'] else Path(settings.BASE_DIR) / 'assets'
        if not source.is_dir():
            raise CommandError(f'Folder not found: {source}')

        dry_run = options['dry_run']
        dest_dir = Path(settings.MEDIA_ROOT) / 'dishes'

        # Build name -> dish lookup; warn if two dishes collapse to the same key.
        lookup = {}
        for dish in Dish.objects.all():
            k = match_key(dish.name)
            if k in lookup:
                self.stdout.write(self.style.WARNING(
                    f'Two dishes share the name key "{k}": "{lookup[k].name}" and "{dish.name}". Skipping that key.'))
                lookup[k] = None
            else:
                lookup[k] = dish

        files = sorted(f for f in source.iterdir() if f.suffix.lower() in IMAGE_EXTS)
        if not files:
            raise CommandError(f'No image files (jpg, jpeg, png, webp) found in {source}')

        matched = skipped = 0
        for f in files:
            dish = lookup.get(match_key(f.stem))
            if dish is None:
                skipped += 1
                self.stdout.write(self.style.WARNING(f'NO MATCH: {f.name}'))
                continue

            if dry_run:
                self.stdout.write(f'Would attach: {f.name} -> {dish.name}')
            else:
                dest_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy(f, dest_dir / f.name)
                dish.image = f'dishes/{f.name}'
                dish.save(update_fields=['image'])
                self.stdout.write(self.style.SUCCESS(f'Attached: {f.name} -> {dish.name}'))
            matched += 1

        verb = 'would be attached' if dry_run else 'attached'
        self.stdout.write(f'\nDone: {matched} {verb}, {skipped} unmatched.')
        if skipped:
            self.stdout.write('Unmatched files: rename them to the dish name, or set the image in the admin.')
