package com.reserve.admin;



import com.reserve.admin.model.Role;
import com.reserve.admin.model.Utilisateur;
import com.reserve.admin.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitConfig implements CommandLineRunner {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        String adminUsername = "admin";
        String adminEmail = "admin@gmail.com";

        // Nettoyage radical pour éviter les doublons ou données corrompues
        utilisateurRepository.findByUsernameIgnoreCase(adminUsername).ifPresent(u -> utilisateurRepository.delete(u));
        utilisateurRepository.findByEmailIgnoreCase(adminEmail).ifPresent(u -> utilisateurRepository.delete(u));

        Utilisateur admin = new Utilisateur(
                adminUsername,
                adminEmail,
                passwordEncoder.encode("admin123"),
                Role.ADMIN
        );
        utilisateurRepository.save(admin);
        System.out.println("✅ Administrateur RECRÉÉ à neuf : admin / admin123");
    }
}
