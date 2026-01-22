import { motion } from 'framer-motion';

export const ParticleExplosion = ({ color = "currentColor" }: { color?: string }) => {
  const particles = Array.from({ length: 8 });
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
          animate={{
            scale: 0,
            opacity: 0,
            x: Math.cos(i * (Math.PI * 2) / 8) * 20,
            y: Math.sin(i * (Math.PI * 2) / 8) * 20,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute w-1 h-1 rounded-full bg-primary"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};
