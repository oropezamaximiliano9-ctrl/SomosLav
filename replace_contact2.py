import sys

with open('src/pages/Landing.tsx', 'r') as f:
    content = f.read()

import re
pattern = re.compile(
    r'<a[^>]*href="https://wa\.me/529212393938\?text=Hola,%20me%20gustar%C3%ADa%20hacer%20un%20pedido%20con%20servicios%20adicionales"[^>]*>.*?</a>',
    re.DOTALL
)

replacement = '''<a 
              href="https://wa.me/529212393938?text=Hola,%20me%20gustar%C3%ADa%20hacer%20un%20pedido%20con%20servicios%20adicionales" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-3 w-full bg-white border border-[#eaeaea] rounded-xl p-4 flex flex-col items-start shadow-sm"
            >
              <h4 className="font-geist font-bold text-[#181818] text-[16px] sm:text-[17px] leading-snug whitespace-nowrap">
                ¿Necesitas algo más?
              </h4>
              <div className="flex items-center justify-between w-full mt-1">
                <p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-relaxed">
                  Solo pídelo.
                </p>
                <div className="bg-[#0f55d8] text-white px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm shrink-0">
                  <Phone className="w-[14px] h-[14px]" />
                  <span className="font-geist font-bold text-[14px] sm:text-[15px] leading-none mt-[1px]">921 239 3938</span>
                </div>
              </div>
            </a>'''

new_content = pattern.sub(replacement, content)
if new_content != content:
    print("Replaced")
else:
    print("Not found")

with open('src/pages/Landing.tsx', 'w') as f:
    f.write(new_content)
