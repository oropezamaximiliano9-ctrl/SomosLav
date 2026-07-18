with open("src/pages/Landing.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<section className="w-full px-4 pt-12 pb-12 flex flex-col justify-start bg-white snap-start snap-always" id="showcase-cards-section"',
    '<section className="w-full px-4 pt-12 pb-12 flex flex-col justify-start snap-start snap-always" id="showcase-cards-section"'
)

content = content.replace(
    'className="bg-[#f8f9fa] rounded-[32px] p-8 sm:p-12 flex flex-col relative overflow-hidden min-h-[450px]"',
    'className="bg-[#f8f9fa] rounded-[32px] p-8 sm:p-12 flex flex-col relative overflow-hidden h-[400px]"'
)

with open("src/pages/Landing.tsx", "w") as f:
    f.write(content)

print("Done")
