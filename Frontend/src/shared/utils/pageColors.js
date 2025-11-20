// Page color mapping based on sidebar icon colors
// Maps route paths to their corresponding icon colors

export const pageColors = {
  '/dashboard': {
    primary: '#0d6efd',
    primaryDark: '#0a58ca',
    gradient: 'from-blue-600 to-blue-700',
    ring: 'ring-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
  },
  '/lead-bulk-upload': {
    primary: '#dc3545',
    primaryDark: '#bb2d3b',
    gradient: 'from-red-600 to-red-700',
    ring: 'ring-red-500',
    border: 'border-red-500',
    bg: 'bg-red-600',
    hover: 'hover:bg-red-700',
  },
  '/batches': {
    primary: '#4b5563',
    primaryDark: '#374151',
    gradient: 'from-gray-600 to-gray-700',
    ring: 'ring-gray-500',
    border: 'border-gray-500',
    bg: 'bg-gray-600',
    hover: 'hover:bg-gray-700',
  },
  '/courses': {
    primary: '#4b5563',
    primaryDark: '#374151',
    primaryLight: '#64748b',
    gradient: 'from-gray-600 to-gray-700',
    ring: 'ring-gray-500',
    border: 'border-gray-500',
    bg: 'bg-gray-600',
    hover: 'hover:bg-gray-700',
  },
  '/trainers': {
    primary: '#4b5563',
    primaryDark: '#374151',
    gradient: 'from-gray-600 to-gray-700',
    ring: 'ring-gray-500',
    border: 'border-gray-500',
    bg: 'bg-gray-600',
    hover: 'hover:bg-gray-700',
  },
  '/users': {
    primary: '#4b5563',
    primaryDark: '#374151',
    gradient: 'from-gray-600 to-gray-700',
    ring: 'ring-gray-500',
    border: 'border-gray-500',
    bg: 'bg-gray-600',
    hover: 'hover:bg-gray-700',
  },
  '/meta-campaigns': {
    primary: '#4b5563',
    primaryDark: '#374151',
    gradient: 'from-gray-600 to-gray-700',
    ring: 'ring-gray-500',
    border: 'border-gray-500',
    bg: 'bg-gray-600',
    hover: 'hover:bg-gray-700',
  },
  '/attendance': {
    primary: '#28a745',
    primaryDark: '#218838',
    gradient: 'from-green-600 to-green-700',
    ring: 'ring-green-500',
    border: 'border-green-500',
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
  },
  '/payments': {
    primary: '#0d6efd',
    primaryDark: '#0a58ca',
    gradient: 'from-blue-600 to-blue-700',
    ring: 'ring-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
  },
  '/invoices': {
    primary: '#17a2b8',
    primaryDark: '#138496',
    gradient: 'from-cyan-600 to-cyan-700',
    ring: 'ring-cyan-500',
    border: 'border-cyan-500',
    bg: 'bg-cyan-600',
    hover: 'hover:bg-cyan-700',
  },
  '/share': {
    primary: '#fd7e14',
    primaryDark: '#e66a00',
    gradient: 'from-orange-600 to-orange-700',
    ring: 'ring-orange-500',
    border: 'border-orange-500',
    bg: 'bg-orange-600',
    hover: 'hover:bg-orange-700',
  },
  '/certifications': {
    primary: '#ff69b4',
    primaryDark: '#ff1493',
    gradient: 'from-pink-500 to-pink-600',
    ring: 'ring-pink-500',
    border: 'border-pink-500',
    bg: 'bg-pink-500',
    hover: 'hover:bg-pink-600',
  },
  '/announcements': {
    primary: '#8a2be2',
    primaryDark: '#7b1fa2',
    gradient: 'from-violet-600 to-violet-700',
    ring: 'ring-violet-500',
    border: 'border-violet-500',
    bg: 'bg-violet-600',
    hover: 'hover:bg-violet-700',
  },
  '/reports': {
    primary: '#0d6efd',
    primaryDark: '#0a58ca',
    gradient: 'from-blue-600 to-blue-700',
    ring: 'ring-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
  },
  '/archived': {
    primary: '#343a40',
    primaryDark: '#23272b',
    gradient: 'from-gray-700 to-gray-800',
    ring: 'ring-gray-500',
    border: 'border-gray-500',
    bg: 'bg-gray-700',
    hover: 'hover:bg-gray-800',
  },
  '/hall-of-fame': {
    primary: '#ffc107',
    primaryDark: '#e0a800',
    gradient: 'from-yellow-500 to-yellow-600',
    ring: 'ring-yellow-500',
    border: 'border-yellow-500',
    bg: 'bg-yellow-500',
    hover: 'hover:bg-yellow-600',
  },
  '/settings': {
    primary: '#6c757d',
    primaryDark: '#5a6268',
    gradient: 'from-gray-600 to-gray-700',
    ring: 'ring-gray-500',
    border: 'border-gray-500',
    bg: 'bg-gray-600',
    hover: 'hover:bg-gray-700',
  },
};

// Get colors for a specific route
export const getPageColors = (path) => {
  // Default to blue if path not found
  return pageColors[path] || pageColors['/dashboard'];
};

// Helper to get Tailwind classes for a route
export const getPageColorClasses = (path) => {
  const colors = getPageColors(path);
  return {
    headerGradient: `bg-gradient-to-r ${colors.gradient}`,
    focusRing: `focus:ring-2 ${colors.ring}`,
    focusBorder: `focus:border-${colors.border.split('-')[1]}-500`,
    buttonBg: colors.bg,
    buttonHover: colors.hover,
    borderColor: colors.border,
  };
};

