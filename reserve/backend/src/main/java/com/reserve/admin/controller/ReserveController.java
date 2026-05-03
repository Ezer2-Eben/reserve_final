package com.reserve.admin.controller;

import com.reserve.admin.model.Reserve;
import com.reserve.admin.service.ReserveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reserves")
@CrossOrigin(origins = "*")
public class ReserveController {

    private final ReserveService reserveService;

    @Autowired
    public ReserveController(ReserveService reserveService) {
        this.reserveService = reserveService;
    }

    // ✅ USER et ADMIN peuvent voir la liste
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public List<Reserve> getAllReserves() {
        return reserveService.getAllReserves();
    }

    // ✅ USER et ADMIN peuvent voir une réserve spécifique
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<Reserve> getReserveById(@PathVariable Long id) {
        Optional<Reserve> reserve = reserveService.getReserveById(id);
        return reserve.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Seul l'ADMIN peut créer une réserve (zone incluse)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Reserve> createReserve(@RequestBody Reserve reserve) {
        Reserve created = reserveService.createReserve(reserve);
        return ResponseEntity.ok(created);
    }

    // ✅ Seul l'ADMIN peut mettre à jour une réserve (zone incluse)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Reserve> updateReserve(@PathVariable Long id, @RequestBody Reserve reserve) {
        Reserve updated = reserveService.updateReserve(id, reserve);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Seul l'ADMIN peut supprimer une réserve
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReserve(@PathVariable Long id) {
        reserveService.deleteReserve(id);
        return ResponseEntity.noContent().build();
    }
}
