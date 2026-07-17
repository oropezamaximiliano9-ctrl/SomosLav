import { useState } from "react";
import { Calendar, Check } from "lucide-react";

export default function AssociateSchedule() {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const timeSlots = ["7:00 AM - 1:00 PM", "1:00 PM - 7:00 PM", "7:00 PM - 10:00 PM"];
  
  const [schedule, setSchedule] = useState<Record<string, boolean[]>>(() => {
    const saved = localStorage.getItem("somos_schedule");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initial: Record<string, boolean[]> = {};
    days.forEach(day => {
      initial[day] = [false, false, false];
    });
    return initial;
  });

  const toggleSchedule = (day: string, slotIndex: number) => {
    setSchedule(prev => {
      const updated = {
        ...prev,
        [day]: prev[day].map((checked, i) => i === slotIndex ? !checked : checked)
      };
      localStorage.setItem("somos_schedule", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="flex-1 flex flex-col pt-4 animate-in fade-in h-full pb-12 overflow-y-auto">
      <div className="w-full max-w-md mx-auto px-4 pb-12 mt-4">
        <div className="flex items-center space-x-2 mb-4">
           <Calendar className="w-8 h-8 text-blue-600 mb-1" />
           <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase">Mi Horario</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">Selecciona los turnos en los que estarás disponible esta semana (bloques de 6 y 3 horas).</p>
        
        <div className="bg-white rounded-none border border-gray-100 overflow-hidden text-left mb-6">
          {days.map((day) => (
             <div key={day} className="border-b border-gray-50 last:border-0 p-4">
               <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">{day}</h3>
               <div className="flex flex-col space-y-2">
                 {timeSlots.map((slot, index) => {
                   const isSelected = schedule[day][index];
                   return (
                     <button
                       key={slot}
                       onClick={() => toggleSchedule(day, index)}
                       className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                         isSelected 
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:border-gray-200"
                       }`}
                     >
                       <span>{slot}</span>
                       <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? "bg-[#0f55d8] text-white" : "bg-gray-200 text-transparent"}`}>
                         <Check className="w-3.5 h-3.5" />
                       </div>
                     </button>
                   );
                 })}
               </div>
             </div>
          ))}
        </div>
        
        <button className="w-full bg-black text-white p-4 rounded-xl font-bold flex items-center justify-center hover:-translate-y-1 transition-all text-lg mb-8">
          Guardar Horarios
        </button>
      </div>
    </div>
  );
}
