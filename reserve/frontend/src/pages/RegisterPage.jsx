// src/pages/RegisterPage.jsx
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await register({
        username: formData.username,
        password: formData.password,
      });
      
      if (result.success) {
        toast({
          title: 'Inscription réussie',
          description: 'Votre compte a été créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Erreur d\'inscription',
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <Flex minH="100vh" w="100%">
      {/* Left Column - Form */}
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
            <Heading size="xl" color="gray.800">Créer un compte</Heading>
            <Text color="gray.500">Rejoignez-nous et gérez les réserves.</Text>
          </VStack>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={5}>
              <FormControl isRequired isInvalid={!!errors.username}>
                <FormLabel fontWeight="500" color="gray.700">Nom d'utilisateur</FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choisissez un pseudo"
                  size="lg"
                  autoComplete="username"
                  bg="gray.50"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
                <FormErrorMessage>{errors.username}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.password}>
                <FormLabel fontWeight="500" color="gray.700">Mot de passe</FormLabel>
                <InputGroup size="lg">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    bg="gray.50"
                    _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                <FormLabel fontWeight="500" color="gray.700">Confirmer le mot de passe</FormLabel>
                <InputGroup size="lg">
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    bg="gray.50"
                    _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      variant="ghost"
                      aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                w="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Création..."
                borderRadius="md"
                boxShadow="md"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              >
                Créer mon compte
              </Button>

              <Text fontSize="sm" color="gray.500" mt={4}>
                Déjà un compte ?{' '}
                <Link as={RouterLink} to="/login" color="brand.600" fontWeight="600">
                  Se connecter
                </Link>
              </Text>
            </VStack>
          </form>
        </VStack>
      </Flex>

      {/* Right Column - Illustration */}
      <Box
        flex="1"
        display={{ base: 'none', lg: 'flex' }}
        bgGradient="linear(to-br, brand.700, brand.900)"
        position="relative"
        overflow="hidden"
        alignItems="center"
        justifyContent="center"
        color="white"
      >
        <Box position="absolute" top="-20%" right="-10%" w="600px" h="600px" bg="brand.500" borderRadius="full" opacity="0.1" filter="blur(60px)" />
        <Box position="absolute" bottom="-10%" left="-10%" w="500px" h="500px" bg="brand.300" borderRadius="full" opacity="0.15" filter="blur(80px)" />

        <VStack spacing={8} zIndex="1" p={12} align="flex-start" maxW="lg">
          <ScaleFade in={true} initialScale={0.9} delay={0.1}>
            <Logo size="80px" color="white" />
          </ScaleFade>
          
          <SlideFade in={true} offsetY="20px" delay={0.2}>
            <Heading size="2xl" lineHeight="1.2">
              Commencez <br/>
              votre <Text as="span" color="brand.300">mission</Text>
            </Heading>
          </SlideFade>
          
          <SlideFade in={true} offsetY="20px" delay={0.3}>
            <Text fontSize="lg" opacity={0.9}>
              Suivez, gérez et protégez les réserves naturelles de notre territoire en rejoignant l'équipe.
            </Text>
          </SlideFade>

          <SlideFade in={true} offsetY="30px" delay={0.4}>
            <Box mt={8} opacity={0.9}>
              {/* Minimal SVG Graphic representing map/shield */}
              <svg width="350" height="250" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M200 40 L320 90 L320 180 C320 240 200 280 200 280 C200 280 80 240 80 180 L80 90 L200 40 Z" fill="rgba(255,255,255,0.1)" stroke="#86efac" strokeWidth="4"/>
                <path d="M150 160 L185 195 L250 130" stroke="#86efac" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="200" cy="80" r="15" fill="rgba(255,255,255,0.2)"/>
              </svg>
            </Box>
          </SlideFade>
        </VStack>
      </Box>
    </Flex>
  );
};

export default RegisterPage;
