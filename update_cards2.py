with open("src/pages/Landing.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className="bg-[#f8f9fa] rounded-[32px] p-8 sm:p-12 flex flex-col relative overflow-hidden h-[400px]"',
    'className="bg-[#f8f9fa] rounded-[32px] p-6 sm:p-8 flex flex-col relative overflow-hidden h-[250px]"'
)

content = content.replace(
    'className="font-geist text-[28px] sm:text-[36px] font-bold text-[#181818] leading-tight inline"',
    'className="font-geist text-[20px] sm:text-[24px] font-bold text-[#181818] leading-tight inline"'
)

content = content.replace(
    'className="font-geist text-[28px] sm:text-[36px] text-[#6A6A6A] leading-tight inline ml-2 font-medium"',
    'className="font-geist text-[20px] sm:text-[24px] text-[#6A6A6A] leading-tight inline ml-2 font-medium"'
)

content = content.replace(
    'className="mt-12 flex-1 relative w-full h-full min-h-[250px] flex items-end justify-center"',
    'className="mt-6 flex-1 relative w-full h-full min-h-[100px] flex items-end justify-center"'
)

with open("src/pages/Landing.tsx", "w") as f:
    f.write(content)

print("Done")
