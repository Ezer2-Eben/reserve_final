// src/components/ui/Logo.jsx
import { Box, Icon } from '@chakra-ui/react';

const LeafIcon = (props) => (
  <Icon viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17 8C8 10 5 16 5 22C5 22 7.5 17.5 13 15C13 19 14 22 14 22C14 22 21 17 21 11C21 7.5 17 8 17 8Z" />
    <path d="M12 2C7 2 3 6 3 11C3 16 7 20 12 20C17 20 21 16 21 11C21 6 17 2 12 2ZM12 18C8.13 18 5 14.87 5 11C5 7.13 8.13 4 12 4C15.87 4 19 7.13 19 11C19 14.87 15.87 18 12 18Z" opacity="0.3" />
  </Icon>
);

const Logo = ({ 
  size = "40px", 
  showAnimation = true, 
  showBorder = true,
  showShadow = true,
  ...props 
}) => {
  return (
    <Box
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...(showAnimation && {
        _hover: {
          transform: "scale(1.05)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }
      })}
      {...props}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        w={size}
        h={size}
        {...(showShadow && {
          filter: "drop-shadow(0 4px 8px rgba(var(--chakra-colors-brand-500), 0.2))"
        })}
        {...(showBorder && {
          borderRadius: "full",
          border: "2px solid",
          borderColor: "brand.100",
          bg: "white",
          p: 1.5
        })}
      >
        <LeafIcon color="brand.500" w="100%" h="100%" />
      </Box>
      
      {/* Effet de brillance */}
      {showAnimation ? (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          borderRadius="full"
          background="linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)"
          opacity="0"
          _hover={{ opacity: 1 }}
          transition="opacity 0.3s ease-in-out"
        />
      ) : null}
    </Box>
  );
};

export default Logo;
