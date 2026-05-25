// src/components/layouts/DashboardLayout.jsx
import {
  Avatar,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
  useToast,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tooltip,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useMemo, useState, useEffect } from 'react';
import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiFolder,
  FiHome,
  FiLogOut,
  FiMap,
  FiMenu,
  FiSettings,
  FiUsers,
  FiX,
  FiBell,
  FiNavigation,
  FiShield,
  FiActivity,
  FiBarChart2,
} from 'react-icons/fi';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { reserveService, alerteService } from '../../services/apiService';
import Logo from '../ui/Logo';

// Animation pour l'entrée de la sidebar
const slideIn = keyframes`
  from { transform: translateX(-10%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Animation pour les éléments
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Icônes pour les menus
const icons = {
  FiHome,
  FiMap,
  FiAlertTriangle,
  FiFileText,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiFolder,
  FiClock,
  FiNavigation,
  FiShield,
  FiActivity,
  FiBarChart2,
};

const menuItems = [
  { name: 'Tableau de bord', icon: 'FiHome', path: '/dashboard', roles: ['ADMIN', 'USER'] },
  { name: 'Réserves', icon: 'FiMap', path: '/dashboard/reserves', roles: ['ADMIN', 'USER'] },
  { name: 'Alertes', icon: 'FiAlertTriangle', path: '/dashboard/alertes', roles: ['ADMIN', 'USER'] },
  { name: 'Projets', icon: 'FiFolder', path: '/dashboard/projets', roles: ['ADMIN', 'USER'] },
  { name: 'Documents', icon: 'FiFileText', path: '/dashboard/documents', roles: ['ADMIN', 'USER'] },
  { name: 'Litiges', icon: 'FiShield', path: '/dashboard/litiges', roles: ['ADMIN', 'USER'] },
  { name: 'Occupations', icon: 'FiActivity', path: '/dashboard/occupations', roles: ['ADMIN', 'USER'] },
  { name: 'Rapports', icon: 'FiBarChart2', path: '/dashboard/rapports', roles: ['ADMIN', 'USER'] },
  { name: 'Historique', icon: 'FiClock', path: '/dashboard/historique', roles: ['ADMIN', 'USER'] },
  { name: 'Exploration', icon: 'FiNavigation', path: '/exploration', roles: ['ADMIN', 'USER'] },
  { name: 'Utilisateurs', icon: 'FiUsers', path: '/dashboard/utilisateurs', roles: ['ADMIN'] },
];

const getPageTitle = (path) => {
  const item = menuItems.find(i => i.path === path);
  if (item) return item.name;
  if (path === '/exploration') return 'Exploration Géographique';
  if (path === '/dashboard/litiges') return 'Gestion des Conflits & Litiges';
  if (path === '/dashboard/occupations') return 'Suivi des Occupations';
  if (path === '/dashboard/rapports') return 'Rapports & Statistiques';
  if (path.includes('/dashboard/reserves/')) return 'Détails Réserve';
  return 'Tableau de bord';
};

const SidebarContent = ({ onClose, isMobile, ...rest }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [reserveCount, setReserveCount] = useState(0);
  const [alerteCount, setAlerteCount] = useState(0);

  useEffect(() => {
    reserveService.getAll()
      .then(data => setReserveCount(data.length))
      .catch(err => console.error("Erreur chargement réserves:", err));
      
    alerteService.getAll()
      .then(data => setAlerteCount(data.length))
      .catch(err => console.error("Erreur chargement alertes:", err));
  }, []);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => item.roles.includes(user?.role));
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Déconnexion',
      description: 'À bientôt !',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    navigate('/login');
  };

  return (
    <Box
      animation={`${slideIn} 0.3s ease-out`}
      bg="white"
      borderRight="1px"
      borderRightColor="gray.200"
      w={{ base: 'full', md: 72 }}
      pos="fixed"
      h="full"
      display="flex"
      flexDirection="column"
      zIndex={10}
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="6" mt={2} justifyContent="space-between">
        <HStack spacing={3} animation={`${fadeInUp} 0.5s ease-out 0.1s both`}>
          <Logo size="32px" />
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Réserves Admin
          </Text>
        </HStack>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onClose}
          variant="ghost"
          icon={<FiX />}
          aria-label="Fermer le menu"
        />
      </Flex>

      <VStack spacing={2} align="stretch" px={4} mt={6} flex="1" overflowY="auto">
        <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2} px={2}>
          Menu
        </Text>
        {filteredMenuItems.map((item, index) => {
          const Icon = icons[item.icon];
          const isActive = location.pathname === item.path;
          
          return (
            <Box
              key={item.name}
              as="button"
              w="full"
              p={3}
              borderRadius="lg"
              bg={isActive ? 'brand.50' : 'transparent'}
              color={isActive ? 'brand.700' : 'gray.600'}
              _hover={{
                bg: isActive ? 'brand.100' : 'gray.50',
                color: isActive ? 'brand.800' : 'gray.900',
              }}
              onClick={() => {
                navigate(item.path);
                if (isMobile && onClose) onClose();
              }}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              transition="all 0.2s"
              animation={`${fadeInUp} 0.4s ease-out ${0.1 + index * 0.05}s both`}
              fontWeight={isActive ? '600' : '500'}
            >
              <HStack spacing={3}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <Text>{item.name}</Text>
              </HStack>
              {item.name === 'Alertes' && alerteCount > 0 && (
                <Box bg="red.500" color="white" fontSize="xs" px={2} py={0.5} borderRadius="full" fontWeight="bold">
                  {alerteCount}
                </Box>
              )}
              {(item.name === 'Réserves' || item.name === 'Exploration') && reserveCount > 0 && (
                <Box bg="red.500" color="white" fontSize="xs" px={2} py={0.5} borderRadius="full" fontWeight="bold">
                  {reserveCount}
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* User profile rich section at bottom */}
      <Box p={4} borderTop="1px" borderColor="gray.100" bg="gray.50" mt="auto">
        <Menu>
          <MenuButton w="full" _hover={{ bg: 'gray.100' }} p={2} borderRadius="md" transition="all 0.2s">
            <HStack spacing={3}>
              <Avatar size="sm" name={user?.username} bg="brand.600" color="white" />
              <VStack align="flex-start" spacing={0} flex={1}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">{user?.username}</Text>
                <Text fontSize="xs" color="gray.500" textTransform="capitalize">{user?.role?.toLowerCase()}</Text>
              </VStack>
              <FiChevronDown color="gray.500" />
            </HStack>
          </MenuButton>
          <MenuList shadow="lg" border="none">
            <MenuItem icon={<FiSettings />} onClick={() => navigate('/dashboard/settings')}>Paramètres</MenuItem>
            <MenuDivider />
            <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.500" fontWeight="500">Déconnexion</MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Box>
  );
};

const MobileNav = ({ onOpen, currentTime, ...rest }) => {
  const location = useLocation();
  return (
    <Flex
      ml={{ base: 0, md: 72 }}
      px={{ base: 4, md: 8 }}
      height="20"
      alignItems="center"
      bg="white"
      borderBottomWidth="1px"
      borderBottomColor="gray.200"
      justifyContent="space-between"
      position="sticky"
      top="0"
      zIndex="9"
      shadow="sm"
      {...rest}
    >
      <HStack spacing={4}>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="outline"
          aria-label="Ouvrir le menu"
          icon={<FiMenu />}
        />
        
        {/* Dynamic Breadcrumb */}
        <Breadcrumb spacing="8px" separator={<FiChevronRight color="gray.400" />} display={{ base: 'none', md: 'flex' }}>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/dashboard" color="gray.500" _hover={{ color: 'brand.500' }}>Admin</BreadcrumbLink>
          </BreadcrumbItem>
          {location.pathname !== '/dashboard' && (
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink color="gray.800" fontWeight="600">{getPageTitle(location.pathname)}</BreadcrumbLink>
            </BreadcrumbItem>
          )}
        </Breadcrumb>
      </HStack>

      <HStack spacing={4}>
        {/* Horloge Live */}
        <HStack display={{ base: 'none', lg: 'flex' }} color="gray.500" fontSize="sm" mr={2}>
          <FiClock />
          <Text>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </HStack>

        {/* Notifications Icon */}
        <Tooltip label="Notifications">
          <IconButton
            icon={<FiBell />}
            variant="ghost"
            color="gray.600"
            _hover={{ bg: 'brand.50', color: 'brand.600' }}
            aria-label="Notifications"
            position="relative"
          />
        </Tooltip>
      </HStack>
    </Flex>
  );
};

const DashboardLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMobile] = useState(window.innerWidth < 768);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Horloge en temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
      
  return (
    <Box minH="100vh" bg="#f8fafc">
      <SidebarContent
        onClose={onClose}
        isMobile={isMobile}
        display={{ base: 'none', md: 'flex' }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton zIndex={20} />
          <DrawerBody p={0}>
            <SidebarContent onClose={onClose} isMobile={isMobile} w="full" borderRight="none" />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      <MobileNav onOpen={onOpen} currentTime={currentTime} />
      
      <Box 
        ml={{ base: 0, md: 72 }} 
        p={{ base: 4, md: 8 }}
        animation={`${fadeInUp} 0.5s ease-out 0.2s both`}
      >
        <Box
          bg="transparent"
          borderRadius="xl"
          transition="all 0.3s ease-smooth"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
