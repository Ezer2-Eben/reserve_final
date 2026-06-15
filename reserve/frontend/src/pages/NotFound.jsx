// src/pages/NotFound.jsx
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Flex,
} from '@chakra-ui/react';
import { FiArrowLeft, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box minH="100vh" bg="gray.50" py={{ base: 10, md: 20 }} display="flex" alignItems="center">
      <Container maxW="lg">
        <VStack spacing={8} textAlign="center" align="center">
          {/* Abstract SVG Illustration for 404 (Forest Theme) */}
          <Box position="relative" w="240px" h="240px" className="animate-slide-up">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="100" fill="var(--chakra-colors-brand-50)" />
              <path d="M100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20" stroke="var(--chakra-colors-brand-200)" strokeWidth="4" strokeLinecap="round" />
              
              {/* Forest elements */}
              <path d="M60 140 L80 90 L100 140 Z" fill="var(--chakra-colors-brand-400)" />
              <path d="M100 150 L125 100 L150 150 Z" fill="var(--chakra-colors-brand-300)" />
              <path d="M85 160 L115 80 L145 160 Z" fill="var(--chakra-colors-brand-500)" opacity="0.8" />
              
              {/* The 404 embedded text/shapes */}
              <text x="100" y="100" fontFamily="Inter" fontSize="48" fontWeight="800" fill="white" textAnchor="middle" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>404</text>
            </svg>
          </Box>

          <VStack spacing={3}>
            <Heading size="xl" color="gray.800" letterSpacing="tight">
              Chemin perdu
            </Heading>
            <Text color="gray.500" fontSize="md" maxW="md">
              Il semblerait que vous vous soyez égaré(e). La page que vous recherchez n'existe pas ou a été déplacée vers une nouvelle zone.
            </Text>
          </VStack>

          <Flex w="full" direction={{ base: 'column', sm: 'row' }} gap={4} justify="center" mt={4}>
            <Button
              colorScheme="brand"
              size="lg"
              leftIcon={<FiHome />}
              onClick={() => navigate('/dashboard')}
              px={8}
            >
              Tableau de bord
            </Button>
            <Button
              variant="outline"
              size="lg"
              colorScheme="gray"
              leftIcon={<FiArrowLeft />}
              onClick={() => navigate(-1)}
              px={8}
            >
              Retour
            </Button>
          </Flex>

          <Text fontSize="xs" color="gray.400" mt={8}>
            Système de gestion du domaine de l'État
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default NotFound;
