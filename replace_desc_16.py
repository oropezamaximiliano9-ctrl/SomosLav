import sys

with open('src/pages/Landing.tsx', 'r') as f:
    content = f.read()

replacements = [
    (
        '<p className="font-geist text-[#6A6A6A] text-[15px] sm:text-[16px] font-medium leading-relaxed">\n                        Recibe tu ropa limpia el mismo día.\n                      </p>',
        '<p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-relaxed">\n                        Recibe tu ropa limpia el mismo día.\n                      </p>'
    ),
    (
        '<p className="font-geist text-[#6A6A6A] text-[15px] sm:text-[16px] font-medium leading-relaxed">\n                  Solo pídelo.\n                </p>',
        '<p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-relaxed">\n                  Solo pídelo.\n                </p>'
    )
]

for target, replacement in replacements:
    if target in content:
        content = content.replace(target, replacement)
        print(f"Replaced a target")
    else:
        print(f"Target not found:\n{target}")

with open('src/pages/Landing.tsx', 'w') as f:
    f.write(content)
