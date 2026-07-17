import_line="import { Check, CheckCircle, CheckCircle2, Clock, Info, Loader2, MapPin, Phone, ShoppingBag, Sparkles, Truck, User, X, Banknote, ArrowRight, Building } from \"lucide-react\";"
sed -i -E "2s/.*/$import_line/" src/pages/Landing.tsx
