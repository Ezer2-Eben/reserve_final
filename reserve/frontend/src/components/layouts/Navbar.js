// src/components/Navbar.jsx
import { Button, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Flex
      as="nav"
      bg="blue.600"
      color="white"
      px={6}
      py={4}
      justify="space-between"
      align="center"
    >
      <Text fontSize="lg" fontWeight="bold">
        Tableau de bord
      </Text>
      <Flex gap={4} align="center">
        {user ? <Text>
            {user.username} ({user.role})
          </Text> : null}
        <Button size="sm" bg="red.500" _hover={{ bg: 'red.600' }} onClick={handleLogout}>
          Déconnexion
        </Button>
      </Flex>
    </Flex>
  );
};

export default Navbar;
