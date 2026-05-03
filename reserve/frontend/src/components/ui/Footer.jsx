import {
    Badge,
    Box,
    Container,
    Divider,
    HStack,
    Icon,
    Link,
    Stack,
    Text,
    useColorModeValue,
    VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

import {
    FiGithub,
    FiGlobe,
    FiHeart,
    FiMail,
    FiMapPin,
    FiPhone,
    FiShield,
    FiTrendingUp,
} from 'react-icons/fi';

const MotionBox = motion(Box);

const Footer = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const currentYear = new Date().getFullYear();

  return (
    <MotionBox
      as="footer"
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxW="7xl" py={8}>
        <Stack spacing={8} align="center">
          {/* Informations principales */}
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={8}
            align="center"
            justify="space-between"
            w="full"
          >
            {/* Logo et description */}
            <VStack align="start" spacing={3} maxW="300px">
              <HStack spacing={2}>
                <Icon as={FiShield} color="blue.500" boxSize={6} />
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Réserves Admin
                </Text>
              </HStack>
              <Text fontSize="sm" color={textColor} textAlign="start">
                Système de gestion moderne pour les réserves naturelles et administratives.
                Développé avec les dernières technologies pour une expérience optimale.
              </Text>
            </VStack>

            {/* Statistiques rapides */}
            <HStack spacing={6} display={{ base: 'none', lg: 'flex' }}>
              <VStack spacing={1} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  15+
                </Text>
                <Text fontSize="xs" color={textColor}>
                  Réserves
                </Text>
              </VStack>
              <VStack spacing={1} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  25+
                </Text>
                <Text fontSize="xs" color={textColor}>
                  Projets
                </Text>
              </VStack>
              <VStack spacing={1} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  50+
                </Text>
                <Text fontSize="xs" color={textColor}>
                  Documents
                </Text>
              </VStack>
            </HStack>

            {/* Contact */}
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                Contact
              </Text>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={FiMail} color="gray.500" boxSize={4} />
                  <Link href="mailto:support@reserves-admin.com" fontSize="sm" color={textColor}>
                    support@reserves-admin.com
                  </Link>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiPhone} color="gray.500" boxSize={4} />
                  <Text fontSize="sm" color={textColor}>
                    +123 456 7890
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiMapPin} color="gray.500" boxSize={4} />
                  <Text fontSize="sm" color={textColor}>
                    Lomé, Togo
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Stack>

          <Divider borderColor={borderColor} />

          {/* Liens et informations */}
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={6}
            align="center"
            justify="space-between"
            w="full"
          >
            {/* Liens utiles */}
            <HStack spacing={6} flexWrap="wrap" justify="center">
              <Link href="/about" fontSize="sm" color={textColor} _hover={{ color: 'blue.500' }}>
                À propos
              </Link>
              <Link href="/help" fontSize="sm" color={textColor} _hover={{ color: 'blue.500' }}>
                Aide
              </Link>
              <Link href="/privacy" fontSize="sm" color={textColor} _hover={{ color: 'blue.500' }}>
                Confidentialité
              </Link>
              <Link href="/terms" fontSize="sm" color={textColor} _hover={{ color: 'blue.500' }}>
                Conditions
              </Link>
            </HStack>

            {/* Réseaux sociaux */}
            <HStack spacing={4}>
              <Link
                href="https://github.com"
                isExternal
                _hover={{ transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <Icon as={FiGithub} color={textColor} boxSize={5} />
              </Link>
              <Link
                href="https://website.com"
                isExternal
                _hover={{ transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <Icon as={FiGlobe} color={textColor} boxSize={5} />
              </Link>
            </HStack>
          </Stack>

          <Divider borderColor={borderColor} />

          {/* Copyright et version */}
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={4}
            align="center"
            justify="space-between"
            w="full"
          >
            <HStack spacing={2}>
              <Text fontSize="sm" color={textColor}>
                © {currentYear} Système de Gestion des Réserves. Tous droits réservés.
              </Text>
              <HStack spacing={1}>
                <Text fontSize="sm" color={textColor}>
                  Développé avec
                </Text>
                <Icon as={FiHeart} color="red.500" boxSize={4} />
                <Text fontSize="sm" color={textColor}>
                  et
                </Text>
                <Icon as={FiTrendingUp} color="green.500" boxSize={4} />
              </HStack>
            </HStack>

            <HStack spacing={3}>
              <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                v2.0.0
              </Badge>
              <Badge colorScheme="green" variant="subtle" fontSize="xs">
                En ligne
              </Badge>
            </HStack>
          </Stack>
        </Stack>
      </Container>
    </MotionBox>
  );
};

export default Footer; 