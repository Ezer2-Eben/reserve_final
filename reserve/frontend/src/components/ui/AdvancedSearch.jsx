import {
    Badge,
    Box,
    Button,
    Checkbox,
    Flex,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    List,
    ListItem,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
    Select,
    Text,
    useColorModeValue,
    useDisclosure,
    VStack
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import {
    FiFilter,
    FiSearch,
    FiX
} from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';


const MotionBox = motion(Box);

const AdvancedSearch = ({
  placeholder = "Rechercher...",
  onSearch,
  filters = {},
  suggestions = [],
  showFilters = true,
  searchTypes = ['all', 'reserves', 'projets', 'documents', 'alertes'],
  onFilterChange,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(filters);
  const [activeFilters, setActiveFilters] = useState([]);
  
  const { isOpen, onClose } = useDisclosure();
  const inputRef = useRef();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Gestion de la recherche
  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      onSearch(searchQuery, selectedFilters);
      setShowSuggestions(false);
      setIsSearching(false);
    }
  };

  // Gestion des filtres
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...selectedFilters,
      [filterType]: value
    };
    setSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
    
    // Mettre à jour les filtres actifs
    const newActiveFilters = Object.entries(newFilters)
      .filter(([_, value]) => value && value !== '')
      .map(([key, value]) => ({ key, value }));
    setActiveFilters(newActiveFilters);
  };

  // Supprimer un filtre
  const removeFilter = (filterKey) => {
    const newFilters = { ...selectedFilters };
    delete newFilters[filterKey];
    setSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
    
    const newActiveFilters = activeFilters.filter(f => f.key !== filterKey);
    setActiveFilters(newActiveFilters);
  };

  // Suggestions de recherche
  const renderSuggestions = () => (
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 ? <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          borderRadius="md"
          shadow="lg"
          mt={1}
          maxH="300px"
          overflowY="auto"
        >
          <List>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={index}
                px={4}
                py={2}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                onClick={() => {
                  setQuery(suggestion.text);
                  handleSearch(suggestion.text);
                }}
              >
                <HStack>
                  <Icon as={suggestion.icon || FiSearch} color="gray.400" boxSize={4} />
                  <Text fontSize="sm">{suggestion.text}</Text>
                  {suggestion.type ? <Badge colorScheme="blue" size="sm" ml="auto">
                      {suggestion.type}
                    </Badge> : null}
                </HStack>
              </ListItem>
            ))}
          </List>
        </MotionBox> : null}
    </AnimatePresence>
  );

  // Panneau de filtres avancés
  const renderFiltersPanel = () => (
    <Popover isOpen={isOpen} onClose={onClose} placement="bottom-start">
      <PopoverTrigger>
        <IconButton
          icon={<FiFilter />}
          variant="outline"
          size="md"
          aria-label="Filtres avancés"
          colorScheme={activeFilters.length > 0 ? 'blue' : 'gray'}
        />
      </PopoverTrigger>
      <PopoverContent p={4} w="400px">
        <PopoverBody>
          <VStack spacing={4} align="stretch">
            <Text fontWeight="semibold" fontSize="lg">
              Filtres avancés
            </Text>
            
            {/* Type de recherche */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Type de contenu
              </Text>
              <Select
                size="sm"
                value={selectedFilters.type || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">Tous les types</option>
                {searchTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Date de création */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Date de création
              </Text>
              <HStack spacing={2}>
                <Input
                  size="sm"
                  type="date"
                  placeholder="Depuis"
                  value={selectedFilters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
                <Input
                  size="sm"
                  type="date"
                  placeholder="Jusqu'à"
                  value={selectedFilters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </HStack>
            </Box>

            {/* Statut */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Statut
              </Text>
              <VStack align="start" spacing={2}>
                {['actif', 'inactif', 'en cours', 'terminé'].map(status => (
                  <Checkbox
                    key={status}
                    size="sm"
                    isChecked={selectedFilters.status?.includes(status)}
                    onChange={(e) => {
                      const currentStatus = selectedFilters.status || [];
                      const newStatus = e.target.checked
                        ? [...currentStatus, status]
                        : currentStatus.filter(s => s !== status);
                      handleFilterChange('status', newStatus);
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Checkbox>
                ))}
              </VStack>
            </Box>

            {/* Actions */}
            <HStack justify="space-between" pt={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedFilters({});
                  setActiveFilters([]);
                  onFilterChange?.({});
                }}
              >
                Réinitialiser
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => {
                  handleSearch();
                  onClose();
                }}
              >
                Appliquer
              </Button>
            </HStack>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );

  return (
    <Box position="relative" w="full">
      <HStack spacing={3} align="center">
        <Box flex={1} position="relative">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              onFocus={() => setShowSuggestions(query.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <InputRightElement>
              {isSearching ? <Box
                  w={4}
                  h={4}
                  border="2px"
                  borderColor="blue.500"
                  borderTopColor="transparent"
                  borderRadius="full"
                  animation="spin 1s linear infinite"
                /> : null}
            </InputRightElement>
          </InputGroup>
          {renderSuggestions()}
        </Box>
        
        {showFilters ? renderFiltersPanel() : null}
        
        <Button
          colorScheme="blue"
          onClick={() => handleSearch()}
          isLoading={isSearching}
          loadingText="Recherche..."
        >
          Rechercher
        </Button>
      </HStack>

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <Flex wrap="wrap" gap={2} mt={3}>
          <Text fontSize="sm" color="gray.600" mr={2}>
            Filtres actifs:
          </Text>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              colorScheme="blue"
              variant="subtle"
              px={2}
              py={1}
              borderRadius="full"
              fontSize="xs"
            >
              {filter.key}: {filter.value}
              <IconButton
                icon={<FiX />}
                size="xs"
                variant="ghost"
                ml={1}
                onClick={() => removeFilter(filter.key)}
                aria-label="Supprimer le filtre"
              />
            </Badge>
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default AdvancedSearch; 