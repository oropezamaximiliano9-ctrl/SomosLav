import sys

with open('src/pages/Landing.tsx', 'r') as f:
    content = f.read()

target = """              <div className="flex flex-col text-left relative z-10">
                <span className="font-geist font-bold text-[#181818] text-[17px] sm:text-[18px] leading-snug">
                  ¿Necesitas algo más?
                </span>
                <span className="font-geist text-[#6A6A6A] text-[15px] sm:text-[16px] font-medium leading-snug mt-0.5">
                  Solo pídelo.
                </span>
              </div>"""

replacement = """              <div className="flex flex-col text-left relative z-10 space-y-1">
                <h4 className="font-geist font-bold text-[#181818] text-[17px] sm:text-[18px] leading-snug">
                  ¿Necesitas algo más?
                </h4>
                <p className="font-geist text-[#6A6A6A] text-[15px] sm:text-[16px] font-medium leading-relaxed">
                  Solo pídelo.
                </p>
              </div>"""

if target in content:
    with open('src/pages/Landing.tsx', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Replaced successfully")
else:
    print("Target not found")
