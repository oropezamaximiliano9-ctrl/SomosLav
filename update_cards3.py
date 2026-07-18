with open("src/pages/Landing.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className="bg-[#f8f9fa] rounded-[32px] p-6 sm:p-8 flex flex-col relative overflow-hidden h-[250px]"',
    'className="bg-[#f8f9fa] rounded-lg p-6 sm:p-8 flex flex-col relative overflow-hidden h-[250px]"'
)

with open("src/pages/Landing.tsx", "w") as f:
    f.write(content)

print("Done")
