package com.reserve.admin.config;
import com.reserve.admin.model.Utilisateur;
import com.reserve.admin.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Autowired
    public CustomUserDetailsService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        System.out.println(">>> [AUTH] Tentative de chargement de l'utilisateur: " + identifier);
        
        // On cherche par username OU par email
        Utilisateur utilisateur = utilisateurRepository.findByUsernameIgnoreCase(identifier)
            .or(() -> utilisateurRepository.findByEmailIgnoreCase(identifier))
            .orElseThrow(() -> {
                System.out.println(">>> [AUTH] Utilisateur non trouvé pour: " + identifier);
                return new UsernameNotFoundException("Utilisateur non trouvé : " + identifier);
            });

        System.out.println(">>> [AUTH] Utilisateur trouvé: " + utilisateur.getUsername() + " avec rôle: " + utilisateur.getRole());

        // ✅ Retourne un objet Spring User - utiliser `roles(...)` pour avoir le préfixe ROLE_ automatiquement
        return User.builder()
            .username(utilisateur.getUsername())
            .password(utilisateur.getPassword())
            .roles(utilisateur.getRole().name()) // ADMIN ou USER -> ROLE_ADMIN / ROLE_USER
            .build();
    }
}
