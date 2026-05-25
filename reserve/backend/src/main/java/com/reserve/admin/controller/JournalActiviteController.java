package com.reserve.admin.controller;

import com.reserve.admin.model.JournalActivite;
import com.reserve.admin.service.JournalActiviteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journal")
@CrossOrigin(origins = "*")
public class JournalActiviteController {

    @Autowired
    private JournalActiviteService journalService;

    @GetMapping
    public ResponseEntity<List<JournalActivite>> getAll() {
        return ResponseEntity.ok(journalService.getAll());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<JournalActivite>> getRecent() {
        return ResponseEntity.ok(journalService.getRecent());
    }

    @GetMapping("/module/{module}")
    public ResponseEntity<List<JournalActivite>> getByModule(@PathVariable String module) {
        return ResponseEntity.ok(journalService.getByModule(module.toUpperCase()));
    }
}
