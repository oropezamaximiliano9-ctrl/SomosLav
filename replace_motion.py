import re

with open('src/pages/Landing.tsx', 'r') as f:
    content = f.read()

# 1. Remove motion imports
content = re.sub(r'import \{ motion, AnimatePresence \} from "motion/react";\n?', '', content)
content = re.sub(r'import \{ AnimatePresence, motion \} from "motion/react";\n?', '', content)

# 2. Replace simple motion.div with div
content = content.replace('<motion.div', '<div')
content = content.replace('</motion.div>', '</div>')
content = content.replace('<motion.p', '<p')
content = content.replace('</motion.p>', '</p>')
content = content.replace('<AnimatePresence mode="wait" initial={false}>', '')
content = content.replace('<AnimatePresence mode="wait">', '')
content = content.replace('</AnimatePresence>', '')

# 3. Handle specific animations
replacements = [
    # Speed lines
    (r'<div\s+className="w-4 h-1 bg-\[#0f55d8\]/40 rounded-full"\s+animate=\{\{\s*x: \[3, -12\],\s*opacity: \[0, 0.7, 0\],\s*scaleX: \[0.5, 1, 0.3\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 0.9,\s*ease: "easeOut",\s*delay: 0\s*\}\}\s*/>',
     r'<div className="w-4 h-1 bg-[#0f55d8]/40 rounded-full animate-speed-line" />'),
    (r'<div\s+className="w-3 h-\[3px\] bg-\[#0f55d8\]/30 rounded-full"\s+animate=\{\{\s*x: \[3, -12\],\s*opacity: \[0, 0.7, 0\],\s*scaleX: \[0.5, 1, 0.3\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 0.9,\s*ease: "easeOut",\s*delay: 0.3\s*\}\}\s*/>',
     r'<div className="w-3 h-[3px] bg-[#0f55d8]/30 rounded-full animate-speed-line" style={{ animationDelay: "0.3s" }} />'),

    # Truck
    (r'<div\s+animate=\{\{\s*y: \[0, -2, 0, -1, 0\],\s*rotate: \[0, 1, -1, 0\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 3,\s*ease: "easeInOut"\s*\}\}\s*>',
     r'<div className="animate-truck-bounce">'),

    # Clock aura spin
    (r'<div\s+className="absolute inset-1 border border-dashed border-\[#0f55d8\]/20 rounded-full -z-10"\s+animate=\{\{\s*rotate: 360\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 8,\s*ease: "linear"\s*\}\}\s*/>',
     r'<div className="absolute inset-1 border border-dashed border-[#0f55d8]/20 rounded-full -z-10 animate-spin-slow" />'),

    # Clock aura pulse
    (r'<div\s+className="absolute inset-0 bg-blue-50/60 rounded-full -z-10"\s+animate=\{\{\s*scale: \[1, 1\.12, 1\],\s*opacity: \[0\.4, 0\.6, 0\.4\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 3,\s*ease: "easeInOut"\s*\}\}\s*/>',
     r'<div className="absolute inset-0 bg-blue-50/60 rounded-full -z-10 animate-aura-pulse" />'),

    # Clock face rotation
    (r'<div\s+animate=\{\{\s*scale: \[1, 1\.04, 1\],\s*rotate: \[0, 3, -3, 0\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 4,\s*ease: "easeInOut"\s*\}\}\s*>',
     r'<div className="animate-clock-wiggle">'),

    # Location aura pulse
    (r'<div\s+className="absolute inset-0 bg-blue-50/70 rounded-full -z-10"\s+animate=\{\{\s*scale: \[1, 1\.15, 1\],\s*opacity: \[0\.3, 0\.8, 0\.3\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 2\.8,\s*ease: "easeInOut"\s*\}\}\s*/>',
     r'<div className="absolute inset-0 bg-blue-50/70 rounded-full -z-10 animate-aura-pulse-fast" />'),

    # Location ripple rings
    (r'<div\s+className="absolute bottom-2 w-8 h-2 bg-blue-500/10 rounded-full"\s+animate=\{\{\s*scale: \[0\.7, 1\.5\],\s*opacity: \[0\.8, 0\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 1\.8,\s*ease: "easeOut"\s*\}\}\s*/>',
     r'<div className="absolute bottom-2 w-8 h-2 bg-blue-500/10 rounded-full animate-ripple-ping" />'),

    # Location pin bounce
    (r'<div\s+animate=\{\{\s*y: \[-3, 3, -3\],\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 2\.2,\s*ease: "easeInOut"\s*\}\}\s*>',
     r'<div className="animate-pin-bounce">'),

    # Emerald pulsing aura
    (r'<div\s+className="absolute inset-0 bg-emerald-50/80 rounded-full -z-10"\s+animate=\{\{\s*scale: \[1, 1\.15, 1\],\s*opacity: \[0\.3, 0\.8, 0\.3\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 2\.8,\s*ease: "easeInOut"\s*\}\}\s*/>',
     r'<div className="absolute inset-0 bg-emerald-50/80 rounded-full -z-10 animate-aura-pulse-fast" />'),

    # Sparkle float 1
    (r'<div\s+className="absolute top-2 right-2 flex items-center justify-center"\s+animate=\{\{\s*scale: \[0, 1\.2, 0\],\s*opacity: \[0, 1, 0\],\s*y: \[0, -6\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 1\.8,\s*ease: "easeInOut"\s*\}\}\s*>',
     r'<div className="absolute top-2 right-2 flex items-center justify-center animate-sparkle-float">'),

    # Sparkle float 2
    (r'<div\s+className="absolute bottom-1 left-2 flex items-center justify-center"\s+animate=\{\{\s*scale: \[0, 1, 0\],\s*opacity: \[0, 0\.9, 0\],\s*y: \[0, -4\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 2\.2,\s*ease: "easeInOut",\s*delay: 0\.6\s*\}\}\s*>',
     r'<div className="absolute bottom-1 left-2 flex items-center justify-center animate-sparkle-float" style={{ animationDelay: "0.6s" }}>'),

    # Banknote cash float
    (r'<div\s+animate=\{\{\s*y: \[-2, 2, -2\],\s*rotate: \[-3, 3, -3\],\s*scale: \[1, 1\.05, 1\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 3\.5,\s*ease: "easeInOut"\s*\}\}\s*>',
     r'<div className="animate-banknote-float">'),

    # Somos Section Scroll In
    (r'<div\s+initial=\{\{\s*opacity: 0,\s*y: 20\s*\}\}\s+whileInView=\{\{\s*opacity: 1,\s*y: 0\s*\}\}\s+viewport=\{\{\s*once: true\s*\}\}\s+transition=\{\{\s*duration: 0\.95,\s*ease: \[0\.16, 1, 0\.3, 1\]\s*\}\}\s+className="relative z-10 w-full max-w-sm mx-auto pt-0 font-sans"\s*>',
     r'<div className="relative z-10 w-full max-w-sm mx-auto pt-0 font-sans animate-in fade-in slide-in-from-bottom-6 duration-1000">'),

    # Map Red Pin
    (r'<div\s+className="absolute top-\[24%\] left-\[40%\] z-20 cursor-pointer origin-bottom"\s+animate=\{\{\s*scale: \[1, 1\.1, 1\]\s*\}\}\s+transition=\{\{\s*repeat: Infinity,\s*duration: 2,\s*ease: "easeInOut"\s*\}\}\s*>',
     r'<div className="absolute top-[24%] left-[40%] z-20 cursor-pointer origin-bottom animate-map-pin-pulse">'),

    # Form AnimatePresence transitions (replace with static divs + animate-in)
    # step-registered
    (r'<div\s+key="step-registered"\s+initial=\{\{\s*opacity: 0\s*\}\}\s+animate=\{\{\s*opacity: 1\s*\}\}\s+exit=\{\{\s*opacity: 0\s*\}\}\s+transition=\{\{\s*duration: 0\.15\s*\}\}\s*>',
     r'<div key="step-registered" className="animate-in fade-in duration-300">'),
    
    # step-verifying
    (r'<div\s+key="step-verifying"\s+initial=\{\{\s*opacity: 0\s*\}\}\s+animate=\{\{\s*opacity: 1\s*\}\}\s+exit=\{\{\s*opacity: 0\s*\}\}\s+transition=\{\{\s*duration: 0\.15\s*\}\}\s*>',
     r'<div key="step-verifying" className="animate-in fade-in duration-300">'),

    # target ring spin
    (r'<div\s+className="absolute inset-0 border-\[2\.5px\] border-dashed border-\[#0f55d8\]/40 rounded-full"\s+animate=\{\{\s*rotate: 360\s*\}\}\s+transition=\{\{\s*duration: 10,\s*repeat: Infinity,\s*ease: "linear"\s*\}\}\s*/>',
     r'<div className="absolute inset-0 border-[2.5px] border-dashed border-[#0f55d8]/40 rounded-full animate-spin-slower" />'),
    
    # ring scale pulse
    (r'<div\s+className="absolute inset-2 bg-\[#0f55d8\]/5 rounded-full"\s+animate=\{\{\s*scale: \[1, 1\.15, 1\],\s*opacity: \[0\.5, 0\.8, 0\.5\]\s*\}\}\s+transition=\{\{\s*duration: 2,\s*repeat: Infinity,\s*ease: "easeInOut"\s*\}\}\s*/>',
     r'<div className="absolute inset-2 bg-[#0f55d8]/5 rounded-full animate-aura-pulse" />'),

    # verification progress bar
    (r'<div\s+className="bg-\[#0f55d8\] h-full"\s+initial=\{\{\s*width: "0%"\s*\}\}\s+animate=\{\{\s+width:\s+verificationProgress === 0 \? "15%" :\s+verificationProgress === 1 \? "45%" :\s+verificationProgress === 2 \? "75%" :\s+"100%"\s*\}\}\s+transition=\{\{\s*duration: 1\.5,\s*ease: "easeInOut"\s*\}\}\s*/>',
     r'<div className="bg-[#0f55d8] h-full transition-all duration-[1500ms] ease-in-out" style={{ width: verificationProgress === 0 ? "15%" : verificationProgress === 1 ? "45%" : verificationProgress === 2 ? "75%" : "100%" }} />'),

    # step-not-eligible
    (r'<div\s+key="step-not-eligible"\s+initial=\{\{\s*opacity: 0\s*\}\}\s+animate=\{\{\s*opacity: 1\s*\}\}\s+exit=\{\{\s*opacity: 0\s*\}\}\s+transition=\{\{\s*duration: 0\.15\s*\}\}\s*>',
     r'<div key="step-not-eligible" className="animate-in fade-in duration-300">'),

    # active-steps-slider
    (r'<div\s+key="active-steps-slider"\s+initial=\{\{\s*opacity: 0\s*\}\}\s+animate=\{\{\s*opacity: 1\s*\}\}\s+exit=\{\{\s*opacity: 0\s*\}\}\s+transition=\{\{\s*duration: 0\.15\s*\}\}\s*>',
     r'<div key="active-steps-slider" className="animate-in fade-in duration-300">'),
     
    # steps indicator 
    (r'<div\s+className="h-full bg-\[#0f55d8\] rounded-full"\s+initial=\{\{\s*width: isActive \? "100%" : "0%"\s*\}\}\s+animate=\{\{\s*width: isActive \? "100%" : "0%"\s*\}\}\s+transition=\{\{\s*duration: step === 1 \? 0 : 0\.35,\s*ease: "easeInOut"\s*\}\}\s*/>',
     r'<div className={`h-full bg-[#0f55d8] rounded-full transition-all ${step === 1 ? "duration-0" : "duration-300 ease-in-out"}`} style={{ width: isActive ? "100%" : "0%" }} />'),

    # gps error
    (r'<p\s+initial=\{\{\s*opacity: 0,\s*y: -5\s*\}\}\s+animate=\{\{\s*opacity: 1,\s*y: 0\s*\}\}\s+className="text-red-500 text-\[11px\] font-bold text-center leading-tight bg-red-50 border border-red-100 py-1\.5 px-3 rounded-lg"\s*>',
     r'<p className="text-red-500 text-[11px] font-bold text-center leading-tight bg-red-50 border border-red-100 py-1.5 px-3 rounded-lg animate-in fade-in slide-in-from-top-1">'),
     
    (r'import \{ ArrowRight', r'import { ArrowRight'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('src/pages/Landing.tsx', 'w') as f:
    f.write(content)
