import re

with open("src/pages/Landing.tsx", "r") as f:
    content = f.read()

new_section = """
      <section className="w-full px-4 pt-12 pb-12 flex flex-col justify-start bg-white snap-start snap-always" id="showcase-cards-section" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
          
          {/* Card 1 */}
          <div className="bg-[#f8f9fa] rounded-[32px] p-8 sm:p-12 flex flex-col relative overflow-hidden min-h-[450px]">
            <div className="z-10 relative max-w-3xl">
              <h3 className="font-geist text-[28px] sm:text-[36px] font-bold text-[#181818] leading-tight inline">
                Título principal de la función.
              </h3>
              <span className="font-geist text-[28px] sm:text-[36px] text-[#6A6A6A] leading-tight inline ml-2 font-medium">
                Descripción secundaria que explica el beneficio detalladamente.
              </span>
            </div>
            
            {/* Empty space for image */}
            <div className="mt-12 flex-1 relative w-full h-full min-h-[250px] flex items-end justify-center">
              {/* Placeholder for diagram/image */}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#f8f9fa] rounded-[32px] p-8 sm:p-12 flex flex-col relative overflow-hidden min-h-[450px]">
            <div className="z-10 relative max-w-3xl">
              <h3 className="font-geist text-[28px] sm:text-[36px] font-bold text-[#181818] leading-tight inline">
                Otro título principal.
              </h3>
              <span className="font-geist text-[28px] sm:text-[36px] text-[#6A6A6A] leading-tight inline ml-2 font-medium">
                Otra descripción secundaria para la segunda tarjeta.
              </span>
            </div>
            
            {/* Empty space for image */}
            <div className="mt-12 flex-1 relative w-full h-full min-h-[250px] flex items-end justify-center">
              {/* Placeholder for diagram/image */}
            </div>
          </div>

        </div>
      </section>
"""

target = "      {/* Bottom Sheet sliding panel modal - High Performance pure CSS */}"

if target in content:
    new_content = content.replace(target, new_section + "\n" + target)
    with open("src/pages/Landing.tsx", "w") as f:
        f.write(new_content)
    print("Success")
else:
    print("Target not found")
