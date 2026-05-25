// src/pages/LoginPage.jsx
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  useToast,
  VStack,
  ScaleFade,
  SlideFade,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/apiService';

// ─── Modal Mot de passe oublié ───────────────────────────────────────────────
const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !newPassword) return;
    if (newPassword.length < 8) {
      toast({
        title: 'Validation',
        description: 'Le mot de passe doit contenir au moins 8 caractères.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.forgotPassword(email, newPassword);
      toast({
        title: 'Mot de passe réinitialisé',
        description: 'Votre mot de passe a été modifié avec succès !',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || err?.message || 'Réinitialisation impossible.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" />
      <ModalContent>
        <ModalHeader>Mot de passe oublié ?</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                Saisissez votre adresse e-mail enregistrée et définissez votre nouveau mot de passe.
              </Text>
              
              <FormControl isRequired>
                <FormLabel>Adresse e-mail</FormLabel>
                <InputGroup>
                  <Input
                    type="email"
                    placeholder="email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Afficher/masquer"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
            <Button colorScheme="brand" type="submit" isLoading={isLoading} leftIcon={<FiKey />}>
              Réinitialiser
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

// ─── LoginPage principale ────────────────────────────────────────────────────
const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isForgotOpen, onOpen: onForgotOpen, onClose: onForgotClose } = useDisclosure();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [credentials, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(credentials);
      
      if (result.success) {
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue dans votre espace de gestion',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Erreur de connexion',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Flex minH="100vh" w="100%">
      {/* Left Column - Illustration (hidden on mobile) */}
      <Box
        flex="1"
        display={{ base: 'none', lg: 'flex' }}
        bgGradient="linear(to-br, brand.800, brand.900)"
        position="relative"
        overflow="hidden"
        alignItems="center"
        justifyContent="center"
        color="white"
      >
        {/* Background decorative circles */}
        <Box
          position="absolute"
          top="-10%"
          left="-10%"
          w="500px"
          h="500px"
          bg="brand.600"
          borderRadius="full"
          opacity="0.2"
          filter="blur(60px)"
        />
        <Box
          position="absolute"
          bottom="-10%"
          right="-10%"
          w="600px"
          h="600px"
          bg="brand.400"
          borderRadius="full"
          opacity="0.1"
          filter="blur(80px)"
        />

        <VStack spacing={8} zIndex="1" p={12} align="flex-start" maxW="lg">
          <ScaleFade in={true} initialScale={0.9} delay={0.1}>
            <Logo size="80px" color="white" />
          </ScaleFade>
          
          <SlideFade in={true} offsetY="20px" delay={0.2}>
            <Heading size="2xl" lineHeight="1.2">
              Préservez notre <br/>
              <Text as="span" color="brand.300">patrimoine naturel</Text>
            </Heading>
          </SlideFade>
          
          <SlideFade in={true} offsetY="20px" delay={0.3}>
            <Text fontSize="lg" opacity={0.9}>
              Le système unifié de gestion et de cartographie des réserves administratives forestières.
            </Text>
          </SlideFade>

          {/* Abstract SVG Illustration */}
          <SlideFade in={true} offsetY="30px" delay={0.4}>
            <Box mt={8} opacity={0.9}>
              <svg width="350" height="250" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="25" y="100" width="120" height="150" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                <rect x="40" y="120" width="90" height="8" rx="4" fill="rgba(255,255,255,0.2)"/>
                <rect x="40" y="140" width="70" height="8" rx="4" fill="rgba(255,255,255,0.2)"/>
                <circle cx="85" cy="200" r="30" fill="currentColor" color="#86efac"/>
                
                <rect x="180" y="50" width="200" height="200" rx="16" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                <path d="M220 180 L250 140 L280 160 L320 100" stroke="#86efac" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="220" cy="180" r="6" fill="#86efac"/>
                <circle cx="250" cy="140" r="6" fill="#86efac"/>
                <circle cx="280" cy="160" r="6" fill="#86efac"/>
                <circle cx="320" cy="100" r="6" fill="#86efac"/>
              </svg>
            </Box>
          </SlideFade>
        </VStack>
      </Box>

      {/* Right Column - Form */}
      <Flex
        flex={{ base: '1', lg: '0.8', xl: '0.6' }}
        alignItems="center"
        justifyContent="center"
        bg="white"
        p={{ base: 8, md: 16 }}
      >
        <VStack w="100%" maxW="400px" spacing={8} align="stretch">
          <Box display={{ base: 'block', lg: 'none' }} alignSelf="center">
            <Logo size="60px" />
          </Box>

          <VStack align="flex-start" spacing={2}>
            <Heading size="xl" color="gray.800">Bon retour !</Heading>
            <Text color="gray.500">Veuillez entrer vos identifiants pour continuer.</Text>
          </VStack>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="500" color="gray.700">Nom d'utilisateur</FormLabel>
                <Input
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="admin"
                  size="lg"
                  autoComplete="username"
                  bg="gray.50"
                  _focus={{ bg: 'white', borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="500" color="gray.700">Mot de passe</FormLabel>
                <InputGroup size="lg">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    bg="gray.50"
                    _focus={{ bg: 'white', borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: 'brand.500' }}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Flex w="100%" justify="flex-end">
                <Link fontSize="sm" color="brand.600" fontWeight="500" onClick={onForgotOpen} _hover={{ textDecoration: 'underline', cursor: 'pointer' }}>
                  Mot de passe oublié ?
                </Link>
              </Flex>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                w="full"
                mt={2}
                isLoading={isLoading}
                loadingText="Connexion..."
                borderRadius="md"
                boxShadow="md"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              >
                Se connecter
              </Button>

            </VStack>
          </form>
        </VStack>
      </Flex>
      
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={onForgotClose} />
    </Flex>
  );
};

export default LoginPage;
