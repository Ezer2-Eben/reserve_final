import {
    Alert, AlertIcon, Badge, Box, Button, Card, CardBody,
    Flex, FormControl, FormLabel, Heading, HStack, IconButton,
    Input, InputGroup, InputLeftElement, InputRightElement,
    Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
    ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner,
    Switch, Table, Tbody, Td, Text, Th,
    Thead, Tooltip, Tr, VStack, useDisclosure, useToast, Divider,
    Tag,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    FiEdit2, FiEye, FiEyeOff, FiKey, FiSearch, FiShield,
    FiTrash2, FiUserPlus, FiUsers, FiPower,
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { utilisateurService } from '../../services/apiService';

// ─── Modal Créer / Modifier ──────────────────────────────────────────────────
const UtilisateurFormModal = ({ isOpen, onClose, utilisateur = null, onSuccess }) => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'USER', actif: true });
    const [showPwd, setShowPwd] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const isEdit = !!utilisateur;

    useEffect(() => {
        if (utilisateur) {
            setFormData({ username: utilisateur.username || '', email: utilisateur.email || '', password: '', role: utilisateur.role || 'USER', actif: utilisateur.actif !== false });
        } else {
            setFormData({ username: '', email: '', password: '', role: 'USER', actif: true });
        }
    }, [utilisateur, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEdit) {
                await utilisateurService.update(utilisateur.id, {
                    username: formData.username,
                    email: formData.email,
                    role: formData.role,
                    actif: formData.actif,
                });
                toast({ title: 'Utilisateur modifié', status: 'success', duration: 3000, isClosable: true });
            } else {
                if (!formData.password || formData.password.length < 8) {
                    toast({ title: 'Mot de passe trop court (min. 8 caractères)', status: 'warning', duration: 3000, isClosable: true });
                    return;
                }
                await utilisateurService.create(formData);
                toast({ title: 'Utilisateur créé', status: 'success', duration: 3000, isClosable: true });
            }
            onSuccess();
            onClose();
        } catch (err) {
            toast({ title: 'Erreur', description: err?.message || 'Opération échouée', status: 'error', duration: 5000, isClosable: true });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
            <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" />
            <ModalContent>
                <ModalHeader>{isEdit ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</ModalHeader>
                <ModalCloseButton />
                <form onSubmit={handleSubmit}>
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Nom d'utilisateur</FormLabel>
                                <Input value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} placeholder="pseudo" />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Email</FormLabel>
                                <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@exemple.com" />
                            </FormControl>
                            {!isEdit && (
                                <FormControl isRequired>
                                    <FormLabel>Mot de passe</FormLabel>
                                    <InputGroup>
                                        <Input type={showPwd ? 'text' : 'password'} value={formData.password}
                                            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                                        <InputRightElement>
                                            <IconButton variant="ghost" size="sm" icon={showPwd ? <FiEyeOff /> : <FiEye />}
                                                onClick={() => setShowPwd(!showPwd)} aria-label="Afficher/masquer" />
                                        </InputRightElement>
                                    </InputGroup>
                                </FormControl>
                            )}
                            <FormControl isRequired>
                                <FormLabel>Rôle</FormLabel>
                                <Select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                                    <option value="USER">Utilisateur — Consultation</option>
                                    <option value="ADMIN">Administrateur — Gestion complète</option>
                                </Select>
                            </FormControl>
                            {isEdit && (
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel mb={0}>Compte actif</FormLabel>
                                    <Switch colorScheme="green" isChecked={formData.actif}
                                        onChange={e => setFormData(p => ({ ...p, actif: e.target.checked }))} />
                                </FormControl>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
                        <Button colorScheme="brand" type="submit" isLoading={isLoading}>
                            {isEdit ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

// ─── Modal Reset Mot de passe ─────────────────────────────────────────────────
const ResetPasswordModal = ({ isOpen, onClose, utilisateur, onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    useEffect(() => { if (!isOpen) setNewPassword(''); }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast({ title: 'Minimum 8 caractères requis', status: 'warning', duration: 3000, isClosable: true });
            return;
        }
        setIsLoading(true);
        try {
            await utilisateurService.resetPassword(utilisateur.id, newPassword);
            toast({ title: 'Mot de passe réinitialisé', status: 'success', duration: 3000, isClosable: true });
            onSuccess();
            onClose();
        } catch (err) {
            toast({ title: 'Erreur', description: err?.message || 'Opération échouée', status: 'error', duration: 5000, isClosable: true });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
            <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" />
            <ModalContent>
                <ModalHeader><HStack><FiKey /><Text>Réinitialiser le mot de passe</Text></HStack></ModalHeader>
                <ModalCloseButton />
                <form onSubmit={handleSubmit}>
                    <ModalBody>
                        <Text mb={3} color="gray.600">
                            Nouveau mot de passe pour <strong>{utilisateur?.username}</strong>
                        </Text>
                        <FormControl isRequired>
                            <InputGroup>
                                <Input type={showPwd ? 'text' : 'password'} value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe (min. 8)" />
                                <InputRightElement>
                                    <IconButton variant="ghost" size="sm" icon={showPwd ? <FiEyeOff /> : <FiEye />}
                                        onClick={() => setShowPwd(!showPwd)} aria-label="Afficher/masquer" />
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
                        <Button colorScheme="orange" type="submit" isLoading={isLoading} leftIcon={<FiKey />}>
                            Réinitialiser
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

// ─── Modal Suppression ────────────────────────────────────────────────────────
const DeleteModal = ({ isOpen, onClose, utilisateur, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await utilisateurService.delete(utilisateur.id);
            toast({ title: 'Utilisateur supprimé', status: 'success', duration: 3000, isClosable: true });
            onSuccess();
            onClose();
        } catch (err) {
            toast({ title: 'Erreur', description: err?.message || 'Suppression échouée', status: 'error', duration: 5000, isClosable: true });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
            <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" />
            <ModalContent>
                <ModalHeader color="red.600">Supprimer l'utilisateur</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text>Êtes-vous sûr de vouloir supprimer <strong>{utilisateur?.username}</strong> ? Cette action est irréversible.</Text>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
                    <Button colorScheme="red" onClick={handleDelete} isLoading={isLoading} leftIcon={<FiTrash2 />}>
                        Supprimer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ─── Page principale Super Admin ──────────────────────────────────────────────
const Utilisateurs = () => {
    const [utilisateurs, setUtilisateurs]   = useState([]);
    const [filtered, setFiltered]           = useState([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [error, setError]                 = useState(null);
    const [searchTerm, setSearchTerm]       = useState('');
    const [roleFilter, setRoleFilter]       = useState('');
    const [selected, setSelected]           = useState(null);
    const toast = useToast();
    const { isAdmin } = useAuth();

    const { isOpen: isFormOpen,   onOpen: onFormOpen,   onClose: onFormClose }   = useDisclosure();
    const { isOpen: isEditOpen,   onOpen: onEditOpen,   onClose: onEditClose }   = useDisclosure();
    const { isOpen: isResetOpen,  onOpen: onResetOpen,  onClose: onResetClose }  = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    const fetchUtilisateurs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await utilisateurService.getAll();
            setUtilisateurs(data);
            setFiltered(data);
        } catch (err) {
            setError(err?.response?.status === 403
                ? 'Accès refusé. Cette page est réservée aux administrateurs.'
                : 'Impossible de charger les utilisateurs. Vérifiez la connexion au serveur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (isAdmin()) fetchUtilisateurs(); else setIsLoading(false); }, []);

    useEffect(() => {
        let result = utilisateurs;
        if (roleFilter) result = result.filter(u => u.role === roleFilter);
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(u =>
                u.username?.toLowerCase().includes(s) ||
                u.email?.toLowerCase().includes(s) ||
                u.role?.toLowerCase().includes(s)
            );
        }
        setFiltered(result);
    }, [searchTerm, roleFilter, utilisateurs]);

    const handleToggleActif = async (u) => {
        try {
            await utilisateurService.toggleActif(u.id);
            toast({ title: `Compte ${u.actif ? 'désactivé' : 'activé'}`, status: 'info', duration: 2000, isClosable: true });
            fetchUtilisateurs();
        } catch {
            toast({ title: 'Erreur lors du changement de statut', status: 'error', duration: 3000, isClosable: true });
        }
    };

    const stats = {
        total:    utilisateurs.length,
        admins:   utilisateurs.filter(u => u.role === 'ADMIN').length,
        users:    utilisateurs.filter(u => u.role === 'USER').length,
        inactifs: utilisateurs.filter(u => u.actif === false).length,
    };

    if (!isAdmin()) return <Alert status="warning"><AlertIcon />Accès réservé aux administrateurs.</Alert>;
    if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;

    return (
        <Box>
            <VStack spacing={6} align="stretch">
                {/* En-tête */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <HStack spacing={2} mb={1}>
                            <FiShield size={22} color="#16a34a" />
                            <Heading size="lg" color="gray.700">Administration des Utilisateurs</Heading>
                        </HStack>
                        <Text color="gray.500">Gérez les comptes, rôles, mots de passe et permissions</Text>
                    </Box>
                    <Button leftIcon={<FiUserPlus />} colorScheme="brand" onClick={onFormOpen}>
                        Nouvel utilisateur
                    </Button>
                </Flex>

                <Divider />

                {/* Statistiques */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    {[
                        { label: 'Total', value: stats.total,    color: 'gray',   icon: <FiUsers /> },
                        { label: 'Admins', value: stats.admins,  color: 'red',    icon: <FiShield /> },
                        { label: 'Utilisateurs', value: stats.users, color: 'blue', icon: <FiUsers /> },
                        { label: 'Inactifs', value: stats.inactifs, color: 'orange', icon: <FiPower /> },
                    ].map(stat => (
                        <Card key={stat.label} shadow="sm" border="1px" borderColor="gray.100">
                            <CardBody py={4}>
                                <HStack justify="space-between">
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">{stat.label}</Text>
                                        <Text fontSize="2xl" fontWeight="bold" color={`${stat.color}.500`}>{stat.value}</Text>
                                    </Box>
                                    <Box color={`${stat.color}.400`} fontSize="xl">{stat.icon}</Box>
                                </HStack>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>

                {/* Filtres */}
                <HStack spacing={3} flexWrap="wrap">
                    <InputGroup maxW="300px">
                        <InputLeftElement pointerEvents="none"><FiSearch color="gray" /></InputLeftElement>
                        <Input placeholder="Rechercher un utilisateur..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </InputGroup>
                    <Select maxW="200px" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">Tous les rôles</option>
                        <option value="ADMIN">Administrateurs</option>
                        <option value="USER">Utilisateurs</option>
                    </Select>
                    <Button size="sm" variant="outline" onClick={fetchUtilisateurs} isLoading={isLoading}>Actualiser</Button>
                </HStack>

                {/* Tableau */}
                <Card shadow="sm" border="1px" borderColor="gray.200">
                    <CardBody p={0}>
                        {isLoading ? (
                            <Box textAlign="center" py={12}><Spinner size="xl" color="brand.500" /></Box>
                        ) : filtered.length === 0 ? (
                            <Box textAlign="center" py={12}>
                                <Text color="gray.400">Aucun utilisateur trouvé.</Text>
                            </Box>
                        ) : (
                            <Box overflowX="auto">
                                <Table variant="simple">
                                    <Thead bg="gray.50">
                                        <Tr>
                                            <Th>Utilisateur</Th>
                                            <Th>Email</Th>
                                            <Th>Rôle</Th>
                                            <Th>Statut</Th>
                                            <Th>Créé le</Th>
                                            <Th>Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {filtered.map((u, i) => (
                                            <Tr key={u.id} bg={i % 2 === 0 ? 'white' : 'gray.50'}
                                                _hover={{ bg: 'green.50' }} transition="background-color 0.15s">
                                                <Td fontWeight="semibold">{u.username}</Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {u.email || <Text as="span" color="gray.400" fontStyle="italic">Non défini</Text>}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={u.role === 'ADMIN' ? 'red' : 'blue'}>
                                                        {u.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Tooltip label={u.actif !== false ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}>
                                                        <Tag
                                                            colorScheme={u.actif !== false ? 'green' : 'gray'}
                                                            cursor="pointer"
                                                            onClick={() => handleToggleActif(u)}
                                                            _hover={{ opacity: 0.8 }}
                                                        >
                                                            {u.actif !== false ? '● Actif' : '○ Inactif'}
                                                        </Tag>
                                                    </Tooltip>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.500">
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={1}>
                                                        <Tooltip label="Modifier">
                                                            <IconButton icon={<FiEdit2 />} size="sm" variant="ghost" colorScheme="blue"
                                                                onClick={() => { setSelected(u); onEditOpen(); }} aria-label="Modifier" />
                                                        </Tooltip>
                                                        <Tooltip label="Réinitialiser le mot de passe">
                                                            <IconButton icon={<FiKey />} size="sm" variant="ghost" colorScheme="orange"
                                                                onClick={() => { setSelected(u); onResetOpen(); }} aria-label="Reset mdp" />
                                                        </Tooltip>
                                                        <Tooltip label="Supprimer">
                                                            <IconButton icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red"
                                                                onClick={() => { setSelected(u); onDeleteOpen(); }} aria-label="Supprimer" />
                                                        </Tooltip>
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                        )}
                    </CardBody>
                </Card>

                <Text fontSize="xs" color="gray.400" textAlign="right">
                    {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                </Text>
            </VStack>

            {/* Modals */}
            <UtilisateurFormModal isOpen={isFormOpen}   onClose={onFormClose}   utilisateur={null}     onSuccess={fetchUtilisateurs} />
            <UtilisateurFormModal isOpen={isEditOpen}   onClose={onEditClose}   utilisateur={selected}  onSuccess={fetchUtilisateurs} />
            <ResetPasswordModal   isOpen={isResetOpen}  onClose={onResetClose}  utilisateur={selected}  onSuccess={fetchUtilisateurs} />
            <DeleteModal          isOpen={isDeleteOpen} onClose={onDeleteClose} utilisateur={selected}  onSuccess={fetchUtilisateurs} />
        </Box>
    );
};

export default Utilisateurs;
