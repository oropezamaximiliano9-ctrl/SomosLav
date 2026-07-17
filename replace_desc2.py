import sys

with open('src/pages/Landing.tsx', 'r') as f:
    content = f.read()

target = '<p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-snug">\n                        Sin pesar ni esperar\n                      </p>'
replacement = '<p className="font-geist text-[#6A6A6A] text-[15px] sm:text-[16px] font-medium leading-snug">\n                        Sin pesar ni esperar\n                      </p>'

if target in content:
    content = content.replace(target, replacement)
    print("Replaced")
else:
    print("Not found")

with open('src/pages/Landing.tsx', 'w') as f:
    f.write(content)
