import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, RefreshCcw, LayoutGrid, Trophy } from 'lucide-react';

export default function WorkflowSection() {
  const steps = [
    { icon: UserPlus, title: "Pick who's playing", color: "text-primary", border: "border-primary/20", hoverBg: "group-hover:bg-primary" },
    { icon: RefreshCcw, title: "Rotate fairly", color: "text-primary", border: "border-primary/20", hoverBg: "group-hover:bg-primary", rotate: true },
    { icon: LayoutGrid, title: "Score live", color: "text-primary", border: "border-primary/20", hoverBg: "group-hover:bg-primary" },
    { icon: Trophy, title: "Recap the day", color: "text-celebration", border: "border-celebration/20", hoverBg: "group-hover:bg-celebration hover:text-primary-dark", bounce: true }
  ];

  return (
    <section id="how-it-works" className="py-24 px-5 md:px-12 bg-surface">
      <div className="max-w-[1280px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-[48px] font-extrabold text-primary-dark mb-4">
            From first serve to final recap.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
              className="relative flex flex-col items-center text-center group"
            >
              <div className={`w-20 h-20 bg-surface-container rounded-full flex items-center justify-center ${step.color} border-2 ${step.border} mb-6 z-10 ${step.hoverBg} group-hover:text-surface group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                <step.icon className={`w-8 h-8 group-hover:scale-110 transition-transform ${step.rotate ? 'group-hover:rotate-180 duration-500' : ''} ${step.bounce ? 'group-hover:animate-bounce group-hover:text-primary-dark' : ''}`} />
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] bg-outline-variant/30 -z-0 group-hover:bg-primary/30 transition-colors"></div>
              )}
              
              <h3 className="font-headline font-bold text-xl mb-2">{step.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
