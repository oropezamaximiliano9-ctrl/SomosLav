import re

with open('src/index.css', 'r') as f:
    content = f.read()

# The @theme block
theme_block_regex = r'@theme\s*\{[^}]*--animate-[^}]+\}\n?'
content = re.sub(theme_block_regex, '', content)

# Keyframes
keyframes_regex = [
    r'@keyframes truck-bounce\s*\{[^}]*\}',
    r'@keyframes speed-line\s*\{[^}]*\}',
    r'@keyframes aura-pulse\s*\{[^}]*\}',
    r'@keyframes clock-wiggle\s*\{[^}]*\}',
    r'@keyframes ripple-ping\s*\{[^}]*\}',
    r'@keyframes pin-bounce\s*\{[^}]*\}',
    r'@keyframes sparkle-float\s*\{[^}]*\}',
    r'@keyframes banknote-float\s*\{[^}]*\}',
    r'@keyframes map-pin-pulse\s*\{[^}]*\}'
]

for kf in keyframes_regex:
    content = re.sub(kf, '', content)

# clean up empty lines
content = re.sub(r'\n{3,}', '\n\n', content)

with open('src/index.css', 'w') as f:
    f.write(content.strip() + '\n')
