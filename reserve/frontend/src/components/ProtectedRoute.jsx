// src/components/ProtectedRoute.jsx
import { Box, Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('ProtectedRoute - État:', { 
    isAuthenticated, 
    isLoading, 
    user: user ? `${user.username} (${user.role})` : 'null',
    requiredRoles 
  });

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Center h="100vh">
          <VStack spacing={4}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="brand.500"
              size="xl"
            />
            <Text color="gray.600" fontSize="lg">
              Vérification de l'authentification...
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Non authentifié, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  // Vérifier que l'utilisateur existe
  if (!user) {
    console.log('ProtectedRoute: Utilisateur manquant, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  // IMPORTANT: Vérification des rôles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      console.log(`ProtectedRoute: Rôle "${user.role}" non autorisé. Rôles requis: ${requiredRoles.join(', ')}`);
      
      // CAS SPÉCIAL: Si non-admin essaie d'accéder à une page admin
      if (user.role !== 'ADMIN') {
        console.log('ProtectedRoute: Utilisateur non-admin, redirection vers /visite');
        return <Navigate to="/visite" replace />;
      }
      
      // Pour d'autres cas de rôles non autorisés
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('ProtectedRoute: Accès autorisé');
  return children;
};

export default ProtectedRoute;