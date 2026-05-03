import {
    Alert,
    AlertIcon,
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Select,
    Text,
    Textarea,
    VStack,
    useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { createProjet, updateProjet } from '../../api/projet';

const ProjetForm = ({ projet = null, onSuccess, onCancel }) => {
  const toast = useToast();
  const [form, setForm] = useState({
    nom: projet?.nom || '',
    description: projet?.description || '',
    dateDebut: projet?.dateDebut || '',
    dateFin: projet?.dateFin || '',
    budget: projet?.budget || '',
    responsable: projet?.responsable || '',
    localisation: projet?.localisation || '',
    statut: projet?.statut || '',
    type: projet?.type || ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (projet) {
        await updateProjet(projet.id, form);
        toast({
          title: 'Projet mis à jour',
          description: 'Le projet a été modifié avec succès.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createProjet(form);
        toast({
          title: 'Projet créé',
          description: 'Le projet a été créé avec succès.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le projet.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="gray.800" mb={2}>
            {projet ? 'Modifier le projet' : 'Créer un nouveau projet'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Remplissez les informations du projet
          </Text>
        </Box>

        {/* Informations de base */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3}>
            Informations de base
          </Text>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.700">Nom du projet</FormLabel>
              <Input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Ex: Conservation de la biodiversité"
                size="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.700">Description</FormLabel>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez les objectifs et activités du projet"
                rows={4}
                size="md"
              />
            </FormControl>

            <HStack spacing={4} width="100%">
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" color="gray.700">Type de projet</FormLabel>
                <Select name="type" value={form.type} onChange={handleChange} size="md">
                  <option value="">Sélectionner un type</option>
                  <option value="Conservation">Conservation</option>
                  <option value="Recherche">Recherche</option>
                  <option value="Éducation">Éducation</option>
                  <option value="Écotourisme">Écotourisme</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Sensibilisation">Sensibilisation</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold" color="gray.700">Statut</FormLabel>
                <Select name="statut" value={form.statut} onChange={handleChange} size="md">
                  <option value="">Sélectionner un statut</option>
                  <option value="Planifié">Planifié</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Suspendu">Suspendu</option>
                </Select>
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        {/* Période et budget */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3}>
            Période et budget
          </Text>
          <VStack spacing={4}>
            <HStack spacing={4} width="100%">
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" color="gray.700">Date de début</FormLabel>
                <Input
                  name="dateDebut"
                  type="date"
                  value={form.dateDebut}
                  onChange={handleChange}
                  size="md"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold" color="gray.700">Date de fin</FormLabel>
                <Input
                  name="dateFin"
                  type="date"
                  value={form.dateFin}
                  onChange={handleChange}
                  size="md"
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.700">Budget (XOF)</FormLabel>
              <Input
                name="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
                placeholder="Ex: 50000"
                size="md"
              />
            </FormControl>
          </VStack>
        </Box>

        {/* Responsabilité et localisation */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3}>
            Responsabilité et localisation
          </Text>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.700">Responsable</FormLabel>
              <Input
                name="responsable"
                value={form.responsable}
                onChange={handleChange}
                placeholder="Ex: Dr. Kossi Adama"
                size="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.700">Localisation</FormLabel>
              <Input
                name="localisation"
                value={form.localisation}
                onChange={handleChange}
                placeholder="Ex: Parc National de la Pendjari"
                size="md"
              />
            </FormControl>
          </VStack>
        </Box>

        {/* Validation des dates */}
        {form.dateDebut && form.dateFin && new Date(form.dateDebut) > new Date(form.dateFin) ? <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              La date de début ne peut pas être postérieure à la date de fin.
            </Text>
          </Alert> : null}

        {/* Boutons d'action */}
        <HStack spacing={4} pt={4}>
          <Button
            type="submit"
            colorScheme="purple"
            size="md"
            flex={1}
            isLoading={loading}
            loadingText="Sauvegarde..."
          >
            {projet ? 'Mettre à jour' : 'Créer le projet'}
          </Button>
          <Button
            type="button"
            variant="outline"
            colorScheme="gray"
            size="md"
            flex={1}
            onClick={handleCancel}
          >
            Annuler
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ProjetForm;


















