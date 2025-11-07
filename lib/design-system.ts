// Système de design centralisé pour l'application

export const colors = {
  // Palette principale - tons chauds et élégants pour une cave à vin
  primary: {
    50: '#fdf4f3',
    100: '#fbe8e6',
    200: '#f8d4d1',
    300: '#f3b5af',
    400: '#eb8a81',
    500: '#e06055',
    600: '#cd3f35',
    700: '#ab2f27',
    800: '#8e2823',
    900: '#762623',
  },

  // Accent - ton bordeaux profond
  accent: {
    50: '#fdf2f4',
    100: '#fce7eb',
    200: '#fad0d9',
    300: '#f6a8b9',
    400: '#f07593',
    500: '#e5446e',
    600: '#d0245a',
    700: '#b01849',
    800: '#931643',
    900: '#7d163e',
  },

  // Neutre
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },

  // Succès (pour les statuts)
  success: {
    light: '#d1fae5',
    DEFAULT: '#10b981',
    dark: '#065f46',
  },

  // Warning
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#92400e',
  },

  // Info
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1e40af',
  }
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  cardHover: '0 4px 16px rgba(0, 0, 0, 0.12)',
}

export const borderRadius = {
  sm: '0.375rem',
  DEFAULT: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
}

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
}

// Classes CSS réutilisables
export const cardStyles = {
  base: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    boxShadow: shadows.card,
    padding: spacing.lg,
    transition: 'all 0.2s ease',
  },
  hover: {
    boxShadow: shadows.cardHover,
    transform: 'translateY(-2px)',
  }
}

export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary[600],
    color: '#ffffff',
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.DEFAULT,
    fontWeight: '600',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[900],
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.DEFAULT,
    fontWeight: '600',
    transition: 'all 0.2s ease',
    border: `1px solid ${colors.neutral[300]}`,
    cursor: 'pointer',
  }
}

// Breakpoints pour le responsive
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
