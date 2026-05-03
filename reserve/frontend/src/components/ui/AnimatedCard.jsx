// src/components/ui/AnimatedCard.jsx
import {
    Box,
    Card,
    CardBody,
    CardHeader,
    useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';


// Animation d'entrée pour les cartes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Animation de pulsation pour les cartes interactives
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const AnimatedCard = ({
  children,
  header,
  isClickable = false,
  isInteractive = false,
  delay = 0,
  onClick,
  variant = 'default',
  ...props
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const variants = {
    default: {
      bg,
      borderColor,
      shadow: 'sm',
      _hover: isInteractive ? {
        shadow: 'md',
        transform: 'translateY(-2px)',
        bg: hoverBg,
      } : {},
    },
    elevated: {
      bg,
      borderColor,
      shadow: 'md',
      _hover: isInteractive ? {
        shadow: 'lg',
        transform: 'translateY(-4px)',
        bg: hoverBg,
      } : {},
    },
    outline: {
      bg: 'transparent',
      borderColor: 'brand.500',
      borderWidth: '2px',
      shadow: 'none',
      _hover: isInteractive ? {
        bg: 'brand.50',
        transform: 'translateY(-1px)',
      } : {},
    },
    gradient: {
      bg: 'linear-gradient(135deg, brand.500 0%, brand.600 100%)',
      color: 'white',
      shadow: 'lg',
      _hover: isInteractive ? {
        shadow: 'xl',
        transform: 'translateY(-3px)',
      } : {},
    },
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <Card
      animation={`${fadeInUp} 0.6s ease-out ${delay}s both`}
      transition="all 0.3s ease-smooth"
      cursor={isClickable ? 'pointer' : 'default'}
      onClick={onClick}
      {...currentVariant}
      {...props}
    >
      {header ? <CardHeader
          pb={2}
          borderBottom="1px"
          borderColor={borderColor}
        >
          {header}
        </CardHeader> : null}
      <CardBody>
        {children}
      </CardBody>
    </Card>
  );
};

// Composant de carte avec effet de survol avancé
export const HoverCard = ({ children, ...props }) => {
  return (
    <AnimatedCard
      isInteractive={true}
      variant="elevated"
      _hover={{
        '& .card-content': {
          transform: 'scale(1.02)',
        },
      }}
      {...props}
    >
      <Box className="card-content" transition="transform 0.3s ease-smooth">
        {children}
      </Box>
    </AnimatedCard>
  );
};

// Composant de carte avec animation de pulsation
export const PulseCard = ({ children, isActive = false, ...props }) => {
  return (
    <AnimatedCard
      animation={isActive ? `${pulse} 2s ease-in-out infinite` : undefined}
      variant="outline"
      borderColor={isActive ? 'brand.500' : 'gray.300'}
      {...props}
    >
      {children}
    </AnimatedCard>
  );
};

// Composant de carte avec gradient
export const GradientCard = ({ children, gradient = 'brand', ...props }) => {
  const gradients = {
    brand: 'linear-gradient(135deg, brand.500 0%, brand.600 100%)',
    green: 'linear-gradient(135deg, green.500 0%, green.600 100%)',
    orange: 'linear-gradient(135deg, orange.500 0%, orange.600 100%)',
    purple: 'linear-gradient(135deg, purple.500 0%, purple.600 100%)',
  };

  return (
    <AnimatedCard
      variant="gradient"
      bg={gradients[gradient] || gradients.brand}
      color="white"
      {...props}
    >
      {children}
    </AnimatedCard>
  );
};

export default AnimatedCard;
