import sys

with open('src/pages/Landing.tsx', 'r') as f:
    content = f.read()

target = '''            <a 
              href="https://wa.me/529212393938?text=Hola,%20me%20gustar%C3%ADa%20hacer%20un%20pedido%20con%20servicios%20adicionales" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-3 w-full bg-white border border-[#eaeaea] rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md active:scale-[0.98] transition-all group"
            >
              <div className="flex flex-col text-left relative z-10 space-y-1">
                <h4 className="font-geist font-bold text-[#181818] text-[16px] sm:text-[17px] leading-snug">
                  ¿Necesitas algo más?
                </h4>
                <p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-relaxed">
                  Solo pídelo.
                </p>
              </div>
              <div className="bg-[#0f55d8] text-white px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm relative z-10 shrink-0 group-hover:bg-[#0c48b8] transition-colors">
                <Phone className="w-[14px] h-[14px]" />
                <span className="font-geist font-bold text-[14px] sm:text-[15px] leading-none mt-[1px]">921 239 3938</span>
              </div>
            </a>'''

replacement = '''            <a 
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

if target in content:
    content = content.replace(target, replacement)
    print("Replaced")
else:
    print("Not found")

with open('src/pages/Landing.tsx', 'w') as f:
    f.write(content)
