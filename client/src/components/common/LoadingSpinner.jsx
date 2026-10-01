import { motion } from 'framer-motion';

/**
 * LoadingSpinner
 * @param {boolean} fullPage - If true, renders as full-page overlay
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} message - Optional loading message
 * @param {string} variant - 'tractor' | 'spinner' | 'dots'
 */
const LoadingSpinner = ({
  fullPage = false,
  size = 'md',
  message = 'Loading...',
  variant = 'tractor',
}) => {
  const sizeMap = {
    sm: { emoji: 'text-2xl', text: 'text-xs', wrapper: 'gap-2' },
    md: { emoji: 'text-4xl', text: 'text-sm', wrapper: 'gap-3' },
    lg: { emoji: 'text-6xl', text: 'text-base', wrapper: 'gap-4' },
  };

  const sz = sizeMap[size] || sizeMap.md;

  const TractorSpinner = () => (
    <div className={`flex flex-col items-center ${sz.wrapper}`}>
      <motion.div
        animate={{ x: [0, 10, 0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        className={sz.emoji}
      >
        🚜
      </motion.div>
      {/* Track animation */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#2D6A4F]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          />
        ))}
      </div>
      {message && (
        <p className={`text-[#2D6A4F] font-medium ${sz.text}`}>{message}</p>
      )}
    </div>
  );

  const CircleSpinner = () => (
    <div className={`flex flex-col items-center ${sz.wrapper}`}>
      <motion.div
        className={`rounded-full border-4 border-green-100 border-t-[#2D6A4F] ${
          size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
        }`}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
      />
      {message && (
        <p className={`text-gray-500 font-medium ${sz.text}`}>{message}</p>
      )}
    </div>
  );

  const DotsSpinner = () => (
    <div className={`flex flex-col items-center ${sz.wrapper}`}>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`bg-[#40916C] rounded-full ${
              size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
            }`}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
          />
        ))}
      </div>
      {message && (
        <p className={`text-gray-500 font-medium ${sz.text}`}>{message}</p>
      )}
    </div>
  );

  const renderVariant = () => {
    if (variant === 'spinner') return <CircleSpinner />;
    if (variant === 'dots') return <DotsSpinner />;
    return <TractorSpinner />;
  };

  if (fullPage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
      >
        <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-4">
          <TractorSpinner />
          <p className="text-xs text-gray-400">Samba Tractors — Powering Your Farm</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {renderVariant()}
    </div>
  );
};

export default LoadingSpinner;
