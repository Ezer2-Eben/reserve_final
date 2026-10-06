package com.reserve.admin;

import com.reserve.admin.model.Role;
import com.reserve.admin.model.Utilisateur;
import com.reserve.admin.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(50)
public class AdminInitConfig implements ApplicationRunner {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(ApplicationArguments args) {
        String adminUsername = "admin";
        String adminEmail = "admin@gmail.com";

        try {
            // Upsert sans delete : évite les crashes FK / données perdues à chaque redémarrage Render
            Utilisateur admin = utilisateurRepository.findByUsernameIgnoreCase(adminUsername)
                    .or(() -> utilisateurRepository.findByEmailIgnoreCase(adminEmail))
                    .orElse(null);

            if (admin == null) {
                admin = new Utilisateur(
                        adminUsername,
                        adminEmail,
                        passwordEncoder.encode("admin123"),
                        Role.SUPER_ADMIN
                );
                utilisateurRepository.save(admin);
                System.out.println("✅ Super admin créé : admin / admin123");
                return;
            }

            boolean changed = false;
            if (admin.getRole() != Role.SUPER_ADMIN) {
                admin.setRole(Role.SUPER_ADMIN);
                changed = true;
            }
            if (!admin.isActif()) {
                admin.setActif(true);
                changed = true;
            }
            if (changed) {
                utilisateurRepository.save(admin);
                System.out.println("✅ Compte admin promu SUPER_ADMIN (mot de passe inchangé)");
            } else {
                System.out.println("✅ Compte admin déjà prêt (SUPER_ADMIN)");
            }
        } catch (Exception e) {
            System.err.println("⚠️ AdminInitConfig non bloquant: " + e.getMessage());
        }
    }
}
