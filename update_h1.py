with open("src/pages/Landing.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'Cesto gratis',
    'Recibe tu cesto hoy'
)

content = content.replace(
    'Pago por servicio',
    'Paga cuando lo uses'
)

with open("src/pages/Landing.tsx", "w") as f:
    f.write(content)

print("Done")
