// src/pages/dashboard/utilisateurs.jsx
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    SimpleGrid,
    Spinner,
    Stat,
    StatArrow,
    StatHelpText,
    StatLabel,
    StatNumber,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    InputRightElement,
    IconButton,
    Select,
    useDisclosure,
    useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    FiSearch,
    FiUserPlus,
    FiEye,
    FiEyeOff
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { utilisateurService } from '../../services/apiService';

const UtilisateurForm = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'USER',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await utilisateurService.create(formData);
            toast({
                title: 'Utilisateur créé',
                description: 'Le compte a été créé avec succès',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onSuccess();
            onClose();
            setFormData({ username: '', password: '', role: 'USER' });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: error.response?.data?.message || 'Une erreur est survenue lors de la création',
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
            <ModalContent>
                <ModalHeader>Créer un nouvel utilisateur</ModalHeader>
                <ModalCloseButton />
                <form onSubmit={handleSubmit}>
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Nom d'utilisateur</FormLabel>
                                <Input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="pseudo"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Mot de passe</FormLabel>
                                <InputGroup>
                                    <Input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                    <InputRightElement>
                                        <IconButton
                                            variant="ghost"
                                            size="sm"
                                            icon={showPassword ? <FiEyeOff /> : <FiEye />}
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label="Afficher/Masquer le mot de passe"
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Rôle</FormLabel>
                                <Select name="role" value={formData.role} onChange={handleChange}>
                                    <option value="USER">Utilisateur (Consultation)</option>
                                    <option value="ADMIN">Administrateur (Gestion complète)</option>
                                </Select>
                            </FormControl>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
                        <Button colorScheme="brand" type="submit" isLoading={isLoading}>
                            Créer l'utilisateur
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

const Utilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [filteredUtilisateurs, setFilteredUtilisateurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    users: 0,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAdmin } = useAuth();

  const fetchUtilisateurs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Tentative de récupération des utilisateurs...');
      const data = await utilisateurService.getAll();
      console.log('Utilisateurs récupérés:', data);
      
      setUtilisateurs(data);
      setFilteredUtilisateurs(data);
      
      // Calculer les statistiques
      const admins = data.filter(u => u.role === 'ADMIN').length;
      const users = data.filter(u => u.role === 'USER').length;
      setStats({
        total: data.length,
        admins,
        users,
      });
    } catch (err) {
      console.error('Erreur détaillée lors du chargement des utilisateurs:', err);
      console.error('Response:', err.response);
      console.error('Request:', err.request);
      console.error('Message:', err.message);
      
      if (err.response?.status === 403) {
        setError('Accès non autorisé. Cette page est réservée aux administrateurs.');
      } else if (err.response?.status === 404) {
        setError('Service des utilisateurs non trouvé. Vérifiez la configuration de l\'API.');
      } else if (err.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Impossible de se connecter au serveur. Vérifiez que l\'API est démarrée.');
      } else {
        setError(`Erreur lors du chargement des utilisateurs: ${err.message || 'Erreur inconnue'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Seulement charger les données si l'utilisateur est admin
    if (isAdmin()) {
      console.log('Utilisateur est admin, chargement des utilisateurs...');
      fetchUtilisateurs();
    } else {
      console.log('Utilisateur n\'est pas admin, pas de chargement');
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const filtered = utilisateurs.filter(utilisateur =>
      utilisateur.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utilisateur.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUtilisateurs(filtered);
  }, [searchTerm, utilisateurs]);

  const getRoleBadge = (role) => {
    const roleConfig = {
      ADMIN: { color: 'red', text: 'Administrateur' },
      USER: { color: 'blue', text: 'Utilisateur' },
    };
    const config = roleConfig[role] || { color: 'gray', text: role };
    return <Badge colorScheme={config.color}>{config.text}</Badge>;
  };

  // Si l'utilisateur n'est pas admin, afficher un message d'erreur
  if (!isAdmin()) {
    return (
      <Alert status="warning">
        <AlertIcon />
        Accès non autorisé. Cette page est réservée aux administrateurs.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* En-tête */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.700" mb={2}>
              Gestion des Utilisateurs
            </Heading>
            <Text color="gray.500">
              Gérez les comptes utilisateurs du système
            </Text>
          </Box>
          {isAdmin() && (
            <Button
              leftIcon={<FiUserPlus />}
              colorScheme="brand"
              onClick={onOpen}
            >
              Nouvel utilisateur
            </Button>
          )}
        </Flex>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total des utilisateurs</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  5%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Administrateurs</StatLabel>
                <StatNumber color="red.500">{stats.admins}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  2%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Utilisateurs</StatLabel>
                <StatNumber color="blue.500">{stats.users}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  8%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Recherche et bouton de test */}
        <HStack spacing={4} justify="space-between">
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Button
            size="sm"
            variant="outline"
            onClick={fetchUtilisateurs}
            isLoading={isLoading}
          >
            Actualiser
          </Button>
        </HStack>

        {/* Tableau des utilisateurs */}
        <Card>
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4} color="gray.500">Chargement des utilisateurs...</Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Nom d'utilisateur</Th>
                      <Th>Rôle</Th>
                      <Th>Date de création</Th>
                      <Th>Statut</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUtilisateurs.map((utilisateur) => (
                      <Tr key={utilisateur.id}>
                        <Td fontWeight="medium">{utilisateur.username}</Td>
                        <Td>{getRoleBadge(utilisateur.role)}</Td>
                        <Td>{utilisateur.createdAt ? new Date(utilisateur.createdAt).toLocaleDateString() : 'N/A'}</Td>
                        <Td>
                          <Badge colorScheme="green">Actif</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>

      <UtilisateurForm 
        isOpen={isOpen} 
        onClose={onClose} 
        onSuccess={fetchUtilisateurs} 
      />
    </Box>
  );
};

export default Utilisateurs; 