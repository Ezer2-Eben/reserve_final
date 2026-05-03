// src/components/ui/LoadingSpinner.jsx
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

// Animation de pulsation pour le spinner
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

// Animation de rotation pour le spinner
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const LoadingSpinner = ({
  size = 'md',
  text = 'Chargement...', 
  variant = 'default',
  fullScreen = false 
}) => {
  const bg = 'white';
  const textColor = 'gray.600';

  const variants = {
    default: {
      spinner: <Spinner size={size} color="brand.500" thickness="3px" speed="0.65s" />,
      animation: spin,
    },
    pulse: {
      spinner: (
        <Box
          w={size === 'sm' ? '20px' : size === 'md' ? '32px' : '48px'}
          h={size === 'sm' ? '20px' : size === 'md' ? '32px' : '48px'}
          borderRadius="full"
          bg="brand.500"
          animation={`${pulse} 1.5s ease-in-out infinite`}
        />
      ),
      animation: pulse,
    },
    dots: {
      spinner: (
        <Box display="flex" gap={2}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              w="8px"
              h="8px"
              borderRadius="full"
              bg="brand.500"
              animation={`${pulse} 1.4s ease-in-out infinite`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </Box>
      ),
      animation: pulse,
    },
  };

  const currentVariant = variants[variant] || variants.default;

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(255, 255, 255, 0.9)"
        backdropFilter="blur(4px)"
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          {currentVariant.spinner}
          {text ? <Text color={textColor} fontSize="sm" fontWeight="medium">
              {text}
          </Text> : null}
        </VStack>
      </Box>
    );
  }

  return (
    <Center py={8}>
      <VStack spacing={4}>
        {currentVariant.spinner}
        {text ? <Text color={textColor} fontSize="sm" fontWeight="medium">
            {text}
          </Text> : null}
      </VStack>
    </Center>
  );
};

// Composant de chargement pour les cartes
export const CardLoadingSpinner = ({ height = '200px' }) => {
  return (
    <Box
      height={height}
      bg="gray.50"
      borderRadius="xl"
      display="flex"
      alignItems="center"
      justifyContent="center"
      border="1px dashed"
      borderColor="gray.200"
    >
      <LoadingSpinner size="md" text="Chargement..." />
    </Box>
  );
};

// Composant de chargement pour les tableaux
export const TableLoadingSpinner = ({ rows = 5 }) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          p={4}
          borderBottom="1px solid"
          borderColor="gray.100"
          bg="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <LoadingSpinner size="sm" text="" />
        </Box>
      ))}
    </Box>
  );
};

export default LoadingSpinner;
