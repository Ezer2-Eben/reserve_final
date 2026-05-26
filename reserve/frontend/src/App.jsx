// src/App.jsx
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './components/ui/NotificationSystem';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import ExplorationPage from './pages/nouvelle_reserve';
import RegisterPage from './pages/RegisterPage';
import VisitePage from './pages/VisitePage';

// Configuration du thème Chakra UI améliorée avec animations et optimisations
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    green: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C7',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
    orange: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  // Amélioration des animations et transitions
  transition: {
    property: {
      common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
      colors: 'background-color, border-color, color, fill, stroke',
      dimensions: 'width, height',
      position: 'left, right, top, bottom',
      background: 'background-color, background-image, background-position',
    },
    easing: {
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'ease-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    duration: {
      'ultra-fast': '50ms',
      'faster': '100ms',
      'fast': '150ms',
      'normal': '200ms',
      'slow': '300ms',
      'slower': '400ms',
      'ultra-slow': '500ms',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'brand.700',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s ease-smooth',
        },
        outline: {
          border: '2px solid',
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            bg: 'brand.100',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s ease-smooth',
        },
        ghost: {
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
            transform: 'translateY(-1px)',
          },
          _active: {
            bg: 'brand.100',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s ease-smooth',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'lg',
          boxShadow: 'sm',
          border: '1px solid',
          borderColor: 'gray.200',
          transition: 'all 0.2s ease-smooth',
          _hover: {
            boxShadow: 'md',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
      variants: {
        filled: {
          field: {
            bg: 'gray.50',
            _hover: {
              bg: 'gray.100',
            },
            _focus: {
              bg: 'white',
              borderColor: 'brand.500',
            },
            transition: 'all 0.2s ease-smooth',
          },
        },
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
      variants: {
        filled: {
          field: {
            bg: 'gray.50',
            _hover: {
              bg: 'gray.100',
            },
            _focus: {
              bg: 'white',
              borderColor: 'brand.500',
            },
            transition: 'all 0.2s ease-smooth',
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
      variants: {
        filled: {
          bg: 'gray.50',
          _hover: {
            bg: 'gray.100',
          },
          _focus: {
            bg: 'white',
            borderColor: 'brand.500',
          },
          transition: 'all 0.2s ease-smooth',
        },
      },
    },
    // Amélioration des animations pour les modales et drawers
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'lg',
          boxShadow: 'xl',
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          borderRadius: 'lg',
        },
      },
    },
    // Amélioration des spinners
    Spinner: {
      defaultProps: {
        color: 'brand.500',
        thickness: '3px',
        speed: '0.65s',
        size: 'md',
      },
    },
    // Amélioration des badges
    Badge: {
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          borderRadius: 'full',
          px: 2,
          py: 1,
          fontSize: 'xs',
          fontWeight: 'medium',
        },
        outline: {
          border: '1px solid',
          borderColor: 'brand.500',
          color: 'brand.500',
          borderRadius: 'full',
          px: 2,
          py: 1,
          fontSize: 'xs',
          fontWeight: 'medium',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: '1.6',
      },
      // Amélioration du scroll
      'html, body': {
        scrollBehavior: 'smooth',
      },
      // Amélioration de la sélection de texte
      '::selection': {
        bg: 'brand.100',
        color: 'brand.800',
      },
      // Amélioration du focus pour l'accessibilité
      '*:focus': {
        outline: '2px solid',
        outlineColor: 'brand.500',
        outlineOffset: '2px',
      },
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Page visite pour les utilisateurs non-admins */}
              <Route 
                path="/visite" 
                element={
                  <ProtectedRoute>
                    <VisitePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Dashboard réservé aux admins uniquement */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/exploration"
                element={
                  <ProtectedRoute>
                    <ExplorationPage />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ChakraProvider>
  );
}

export default App;
