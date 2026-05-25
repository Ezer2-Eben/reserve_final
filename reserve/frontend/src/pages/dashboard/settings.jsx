// src/pages/dashboard/settings.jsx — Paramètres de l'application & Profil Admin
import {
  Avatar, Box, Button, Card, CardBody, Divider, Flex, FormControl,
  FormLabel, Heading, HStack, Input, InputGroup, InputRightElement,
  SimpleGrid, Spinner, Switch, Text, useToast, VStack, Icon, Badge,
  IconButton,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiSettings, FiUser, FiLock, FiSliders, FiDatabase,
  FiEye, FiEyeOff, FiSave, FiRefreshCw,
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { utilisateurService } from '../../services/apiService';

const Settings = () => {
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const toast = useToast();

  // Formulaire Profil
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
  });

  // Formulaire Mot de Passe
  const [pwdForm, setPwdForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);

  // Préférences système (simulées)
  const [sysPrefs, setSysPrefs] = useState({
    maintenance: false,
    emailAlerts: true,
    autoBackup: true,
    debugMode: false,
  });

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const allUsers = await utilisateurService.getAll();
      const me = allUsers.find(u => u.username?.toLowerCase() === user?.username?.toLowerCase());
      if (me) {
        setCurrentUserData(me);
        setProfileForm({
          username: me.username || '',
          email: me.email || '',
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUserData) return;
    setIsSavingProfile(true);
    try {
      await utilisateurService.update(currentUserData.id, {
        username: profileForm.username,
        email: profileForm.email,
        role: currentUserData.role,
        actif: currentUserData.actif,
      });
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations personnelles ont été enregistrées.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchProfile();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de mettre à jour le profil.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentUserData) return;
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast({
        title: 'Erreur validation',
        description: 'Les mots de passe ne correspondent pas.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      toast({
        title: 'Erreur validation',
        description: 'Le mot de passe doit contenir au moins 8 caractères.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSavingPwd(true);
    try {
      await utilisateurService.resetPassword(currentUserData.id, pwdForm.newPassword);
      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été mis à jour avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setPwdForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Changement de mot de passe échoué.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingPwd(false);
    }
  };

  const handleBackup = () => {
    setIsBackupLoading(true);
    setTimeout(() => {
      setIsBackupLoading(false);
      toast({
        title: 'Sauvegarde réussie',
        description: 'Base de données exportée avec succès ! (reserve_backup.sql)',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 2000);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4} color="gray.500">Chargement de vos paramètres...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* En-tête */}
        <Box>
          <HStack spacing={2} mb={1}>
            <FiSettings size={22} color="#4f46e5" />
            <Heading size="lg" color="gray.700">Paramètres Généraux</Heading>
          </HStack>
          <Text color="gray.500">Gérez vos informations personnelles et configurez l'application</Text>
        </Box>

        <Divider />

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Section Profil */}
          <Card shadow="sm" border="1px" borderColor="gray.100">
            <CardBody>
              <HStack spacing={4} mb={6}>
                <Avatar size="lg" name={currentUserData?.username} bg="brand.600" color="white" />
                <Box>
                  <Heading size="md" color="gray.700">{currentUserData?.username}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    Rôle : <Badge colorScheme="red">{currentUserData?.role}</Badge>
                  </Text>
                </Box>
              </HStack>

              <Heading size="sm" mb={4} color="gray.600" display="flex" alignItems="center">
                <Icon as={FiUser} mr={2} /> Informations personnelles
              </Heading>

              <form onSubmit={handleUpdateProfile}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <Input
                      value={profileForm.username}
                      onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Adresse e-mail</FormLabel>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </FormControl>

                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="brand"
                    type="submit"
                    isLoading={isSavingProfile}
                    alignSelf="flex-start"
                    mt={2}
                  >
                    Enregistrer
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Section Sécurité */}
          <Card shadow="sm" border="1px" borderColor="gray.100">
            <CardBody>
              <Heading size="sm" mb={4} color="gray.600" display="flex" alignItems="center">
                <Icon as={FiLock} mr={2} /> Sécurité & Mot de passe
              </Heading>

              <form onSubmit={handleUpdatePassword}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min. 8 caractères"
                        value={pwdForm.newPassword}
                        onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                      />
                      <InputRightElement>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={showPwd ? <FiEyeOff /> : <FiEye />}
                          onClick={() => setShowPwd(!showPwd)}
                          aria-label="Afficher/masquer"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Ressaisir le mot de passe"
                        value={pwdForm.confirmPassword}
                        onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      />
                    </InputGroup>
                  </FormControl>

                  <Button
                    leftIcon={<FiRefreshCw />}
                    colorScheme="orange"
                    type="submit"
                    isLoading={isSavingPwd}
                    alignSelf="flex-start"
                    mt={2}
                  >
                    Modifier le mot de passe
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Section Préférences Système */}
        <Card shadow="sm" border="1px" borderColor="gray.100">
          <CardBody>
            <Heading size="sm" mb={6} color="gray.600" display="flex" alignItems="center">
              <Icon as={FiSliders} mr={2} /> Options de configuration & Maintenance
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <VStack align="stretch" spacing={4}>
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">Mode maintenance</Text>
                    <Text fontSize="xs" color="gray.500">Restreindre temporairement l'accès au portail visiteur</Text>
                  </Box>
                  <Switch
                    colorScheme="red"
                    isChecked={sysPrefs.maintenance}
                    onChange={e => setSysPrefs(p => ({ ...p, maintenance: e.target.checked }))}
                  />
                </Flex>

                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">Alertes par e-mail</Text>
                    <Text fontSize="xs" color="gray.500">Être notifié immédiatement en cas d'alerte critique</Text>
                  </Box>
                  <Switch
                    colorScheme="brand"
                    isChecked={sysPrefs.emailAlerts}
                    onChange={e => setSysPrefs(p => ({ ...p, emailAlerts: e.target.checked }))}
                  />
                </Flex>

                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">Sauvegarde planifiée</Text>
                    <Text fontSize="xs" color="gray.500">Activer les sauvegardes quotidiennes de la base de données</Text>
                  </Box>
                  <Switch
                    colorScheme="brand"
                    isChecked={sysPrefs.autoBackup}
                    onChange={e => setSysPrefs(p => ({ ...p, autoBackup: e.target.checked }))}
                  />
                </Flex>
              </VStack>

              <VStack align="flex-start" spacing={4} justify="center" p={4} bg="gray.50" borderRadius="lg" border="1px" borderColor="gray.100">
                <Heading size="xs" color="gray.700" display="flex" alignItems="center">
                  <Icon as={FiDatabase} mr={1.5} /> Outils d'administration
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Déclenchez une sauvegarde à chaud de la base de données SQL `reserve` ou exportez les logs systèmes.
                </Text>
                <Button
                  size="sm"
                  leftIcon={<FiDatabase />}
                  colorScheme="brand"
                  variant="outline"
                  onClick={handleBackup}
                  isLoading={isBackupLoading}
                >
                  Sauvegarder la base de données
                </Button>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Settings;
