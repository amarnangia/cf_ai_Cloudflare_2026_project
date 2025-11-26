import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden" style={{
      background: 'linear-gradient(135deg, #8B4049 0%, #5C2E35 50%, #3D1F24 100%)'
    }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full" style={{
          background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)'
        }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full" style={{
          background: 'radial-gradient(circle, #F5E6D3 0%, transparent 70%)'
        }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full" style={{
          background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)'
        }} />
      </div>

      {/* Abstract dance patterns */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dance-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 20 50 Q 30 20, 40 50 T 60 50" stroke="#F5E6D3" fill="none" strokeWidth="2" />
              <circle cx="50" cy="50" r="3" fill="#D4AF37" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dance-pattern)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-50" style={{
                background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)'
              }} />
              <Sparkles className="w-16 h-16 relative" style={{ color: '#D4AF37' }} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-7xl font-bold mb-6"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              color: '#F5E6D3',
              letterSpacing: '0.02em'
            }}
          >
            NrityaAI
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-2xl mb-12"
            style={{
              color: '#F5E6D3',
              opacity: 0.9,
              fontWeight: 300
            }}
          >
            Your Personalized Indian Dance Learning Companion
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Button
              onClick={() => navigate('/chat')}
              className="px-12 py-7 text-lg font-medium rounded-full transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                color: '#3D1F24',
                border: 'none',
                boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(212, 175, 55, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(212, 175, 55, 0.3)';
              }}
            >
              Start Learning
            </Button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 text-center"
          style={{ color: '#F5E6D3', opacity: 0.6 }}
        >
          <p className="text-sm">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:underline mx-2">GitHub</a>
            •
            <a href="#about" className="hover:underline mx-2">About</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;