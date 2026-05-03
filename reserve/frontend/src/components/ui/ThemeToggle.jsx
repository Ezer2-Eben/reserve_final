import {
    Box,
    IconButton,
    Tooltip,
    useColorMode,
    useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

const MotionBox = motion(Box);

const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const iconColor = useColorModeValue('yellow.500', 'blue.400');

  return (
    <Tooltip
      label={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      placement="bottom"
    >
      <MotionBox
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <IconButton
          aria-label="Basculer le thème"
          icon={
            <MotionBox
              initial={false}
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? <FiSun /> : <FiMoon />}
            </MotionBox>
          }
          onClick={toggleColorMode}
          variant="ghost"
          colorScheme={isDark ? 'blue' : 'yellow'}
          size="md"
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          _hover={{
            bg: useColorModeValue('gray.50', 'gray.700'),
            transform: 'translateY(-1px)',
            shadow: 'md',
          }}
          transition="all 0.2s"
        />
      </MotionBox>
    </Tooltip>
  );
};

export default ThemeToggle; 