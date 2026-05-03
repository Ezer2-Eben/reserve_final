import {
    Badge,
    Box,
    CloseButton,
    Flex,
    HStack,
    Icon,
    Portal,
    Text,
    useColorModeValue,
    VStack
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useContext, useState } from 'react';
import {
    FiAlertCircle,
    FiCheckCircle,
    FiInfo,
    FiXCircle
} from 'react-icons/fi';

const NotificationContext = createContext();

const MotionBox = motion.create(Box);

const notificationTypes = {
  success: {
    icon: FiCheckCircle,
    color: 'green',
    bgColor: 'green.50',
    borderColor: 'green.200'
  },
  error: {
    icon: FiXCircle,
    color: 'red',
    bgColor: 'red.50',
    borderColor: 'red.200'
  },
  warning: {
    icon: FiAlertCircle,
    color: 'orange',
    bgColor: 'orange.50',
    borderColor: 'orange.200'
  },
  info: {
    icon: FiInfo,
    color: 'blue',
    bgColor: 'blue.50',
    borderColor: 'blue.200'
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, clearAll, notifications }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);

  return (
    <Portal>
      <Box
        position="fixed"
        top={4}
        right={4}
        zIndex={9999}
        maxW="400px"
        w="full"
      >
        <AnimatePresence>
          {notifications.map((notification) => (
            <MotionBox
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              mb={3}
            >
              <NotificationItem
                notification={notification}
                onClose={() => removeNotification(notification.id)}
              />
            </MotionBox>
          ))}
        </AnimatePresence>
      </Box>
    </Portal>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const { type = 'info', title, message, action } = notification;
  const config = notificationTypes[type] || notificationTypes.info;
  const IconComponent = config.icon;
  
  const bgColor = useColorModeValue(config.bgColor, 'gray.700');
  const borderColor = useColorModeValue(config.borderColor, 'gray.600');

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      shadow="lg"
      _hover={{ shadow: 'xl' }}
      transition="all 0.2s"
    >
      <Flex align="start" justify="space-between">
        <HStack align="start" spacing={3} flex={1}>
          <Icon
            as={IconComponent}
            color={`${config.color}.500`}
            boxSize={5}
            mt={0.5}
          />
          <VStack align="start" spacing={1} flex={1}>
            <HStack justify="space-between" w="full">
              <Text fontWeight="semibold" fontSize="sm">
                {title}
              </Text>
              <Badge colorScheme={config.color} size="sm">
                {type}
              </Badge>
            </HStack>
            {message ? <Text fontSize="sm" color="gray.600" lineHeight="short">
                {message}
              </Text> : null}
            {action ? <Box mt={2}>
                {action}
              </Box> : null}
          </VStack>
        </HStack>
        <CloseButton
          size="sm"
          onClick={onClose}
          color="gray.400"
          _hover={{ color: 'gray.600' }}
        />
      </Flex>
    </Box>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook utilitaire pour des notifications rapides
export const useQuickNotifications = () => {
  const { addNotification } = useNotifications();
  
  return {
    success: (title, message) => addNotification({ type: 'success', title, message }),
    error: (title, message) => addNotification({ type: 'error', title, message }),
    warning: (title, message) => addNotification({ type: 'warning', title, message }),
    info: (title, message) => addNotification({ type: 'info', title, message })
  };
}; 