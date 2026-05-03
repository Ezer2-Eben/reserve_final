// src/components/ui/FiltersDrawer.jsx
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Button,
  HStack,
  Text,
  Box,
  Divider,
} from '@chakra-ui/react';
import { FiFilter, FiLogOut, FiRefreshCw } from 'react-icons/fi';

const FiltersDrawer = ({
  isOpen,
  onClose,
  selectedType,
  setSelectedType,
  selectedStatut,
  setSelectedStatut,
  existingReserves = [],
  getColorByStatut,
  getBorderColorByStatut,
  filteredReserves = [],
  onRefresh,
  onLogout,
}) => {
  // Obtenir les types et statuts uniques
  const uniqueTypes = ['TOUS', ...new Set(existingReserves.map(r => r.properties.type))];
  const uniqueStatuts = ['TOUS', ...new Set(existingReserves.map(r => r.properties.statut))];

  return (
    <Drawer
      isOpen={isOpen}
      placement="left"
      onClose={onClose}
      size="xs"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton size="sm" />
        <DrawerHeader borderBottomWidth="1px" py={3}>
          <HStack spacing={2}>
            <FiFilter size="16px" />
            <Text fontSize="md">Filtres</Text>
          </HStack>
        </DrawerHeader>

        <DrawerBody py={4}>
          <VStack spacing={5} align="stretch">
            {/* Filtre par type */}
            <FormControl>
              <FormLabel fontSize="sm" mb={1}>Type</FormLabel>
              <Select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                size="sm"
              >
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'TOUS' ? 'Tous' : type}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Filtre par statut */}
            <FormControl>
              <FormLabel fontSize="sm" mb={1}>Statut</FormLabel>
              <Select 
                value={selectedStatut} 
                onChange={(e) => setSelectedStatut(e.target.value)}
                size="sm"
              >
                {uniqueStatuts.map(statut => (
                  <option key={statut} value={statut}>
                    {statut === 'TOUS' ? 'Tous' : statut}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Divider />

            {/* Légende */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Légende</Text>
              <VStack spacing={1} align="stretch">
                {uniqueStatuts.filter(s => s !== 'TOUS').map(statut => (
                  <HStack key={statut} spacing={2}>
                    <Box 
                      w="12px" 
                      h="12px" 
                      borderRadius="sm" 
                      bg={getColorByStatut(statut)}
                      border={`1px solid ${getBorderColorByStatut(statut)}`}
                    />
                    <Text fontSize="xs">{statut}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* Statistiques */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Résultats</Text>
              <Text fontSize="sm">{filteredReserves.length} réserves</Text>
              <Text fontSize="xs" color="gray.500">
                sur {existingReserves.length} au total
              </Text>
            </Box>

            <Divider />

            {/* Actions */}
            <VStack spacing={2}>
              <Button
                leftIcon={<FiRefreshCw size="14px" />}
                colorScheme="brand"
                size="sm"
                w="full"
                onClick={onRefresh}
              >
                Actualiser
              </Button>
              
              <Button
                leftIcon={<FiLogOut size="14px" />}
                variant="outline"
                size="sm"
                w="full"
                onClick={onLogout}
              >
                Déconnexion
              </Button>
            </VStack>

            {/* Note */}
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Mode consultation seule
            </Text>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default FiltersDrawer;