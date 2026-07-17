import re

with open('src/pages/Landing.tsx', 'r') as f:
    content = f.read()

# Remove specific animation classes
animation_classes = [
    'animate-aura-pulse',
    'animate-aura-pulse-fast',
    'animate-bounce',
    'animate-in',
    'animate-pulse',
    'animate-ripple-ping',
    'animate-shake',
    'animate-sparkle-float',
    'animate-speed-line',
    'animate-spin',
    'animate-spin-slow',
    'animate-spin-slower',
    'animate-truck-bounce',
    'animate-clock-wiggle',
    'animate-pin-bounce',
    'animate-banknote-float',
    'animate-map-pin-pulse',
    'fade-in',
    'slide-in-from-bottom-6',
    'slide-in-from-top-1',
    'duration-1000',
    'duration-300',
    r'duration-\[1500ms\]',
    'transition-all',
    'ease-in-out',
    'duration-0'
]

for cls in animation_classes:
    content = re.sub(rf'\b{cls}\b\s*', '', content)

# Also remove inline styles used for animations
content = re.sub(r'\s*style=\{\{\s*animationDelay:[^}]+\}\}', '', content)

# Clean up empty classNames
content = re.sub(r'className=""\s*', '', content)
content = re.sub(r'className=" "\s*', '', content)
content = re.sub(r'className=\{`\s*`\}\s*', '', content)

with open('src/pages/Landing.tsx', 'w') as f:
    f.write(content)

