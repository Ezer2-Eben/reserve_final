package com.reserve.admin.controller;

import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Element;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rapports")
@CrossOrigin(origins = "*")
public class RapportController {

    @Autowired private ReserveRepository reserveRepository;
    @Autowired private AlerteRepository alerteRepository;
    @Autowired private ProjetRepository projetRepository;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private LitigeRepository litigeRepository;
    @Autowired private OccupationRepository occupationRepository;

    // ─── Statistiques globales ───────────────────────────────────────────────
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques() {
        java.util.List<Reserve> reserves = reserveRepository.findAll();

        double superficieTotal = reserves.stream()
                .mapToDouble((Reserve r) -> r.getSuperficie() != null ? r.getSuperficie() : 0.0)
                .sum();

        Map<String, Long> parStatut = reserves.stream()
                .collect(Collectors.groupingBy((Reserve r) -> r.getStatut() != null ? r.getStatut() : "INCONNU", Collectors.counting()));

        long alertesActives = alerteRepository.findAll().stream()
                .filter(a -> "ACTIVE".equals(a.getStatutAlerte()) || a.getStatutAlerte() == null)
                .count();

        long litiges = litigeRepository.count();
        long litigesOuverts = litigeRepository.findByStatut(com.reserve.admin.model.Litige.StatutLitige.OUVERT).size();
        long occupationsIllegales = occupationRepository.findByTypeOccupation(com.reserve.admin.model.Occupation.TypeOccupation.ILLEGALE).size();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalReserves", reserves.size());
        stats.put("superficieTotal", Math.round(superficieTotal * 100.0) / 100.0);
        stats.put("parStatut", parStatut);
        stats.put("alertesActives", alertesActives);
        stats.put("totalProjets", projetRepository.count());
        stats.put("totalDocuments", documentRepository.count());
        stats.put("totalLitiges", litiges);
        stats.put("litigesOuverts", litigesOuverts);
        stats.put("occupationsIllegales", occupationsIllegales);

        return ResponseEntity.ok(stats);
    }

    // ─── Export Excel ─────────────────────────────────────────────────────────
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel() throws Exception {
        java.util.List<Reserve> reserves = reserveRepository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // Feuille 1 — Réserves
            Sheet sheet = workbook.createSheet("Réserves");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"ID", "Nom", "Localisation", "Superficie (ha)", "Type", "Statut", "Propriétaire", "Référence"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Reserve r : reserves) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(r.getId());
                row.createCell(1).setCellValue(r.getNom() != null ? r.getNom() : "");
                row.createCell(2).setCellValue(r.getLocalisation() != null ? r.getLocalisation() : "");
                row.createCell(3).setCellValue(r.getSuperficie() != null ? r.getSuperficie() : 0);
                row.createCell(4).setCellValue(r.getType() != null ? r.getType() : "");
                row.createCell(5).setCellValue(r.getStatut() != null ? r.getStatut() : "");
                row.createCell(6).setCellValue(r.getProprietaire() != null ? r.getProprietaire() : "");
                row.createCell(7).setCellValue(r.getReference() != null ? r.getReference() : "");
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            // Feuille 2 — Litiges
            Sheet sheetLitiges = workbook.createSheet("Litiges");
            String[] litHeaders = {"ID", "Titre", "Type", "Statut", "Réserve", "Date Ouverture", "Date Échéance"};
            Row lhRow = sheetLitiges.createRow(0);
            for (int i = 0; i < litHeaders.length; i++) {
                Cell c = lhRow.createCell(i);
                c.setCellValue(litHeaders[i]);
                c.setCellStyle(headerStyle);
            }
            int lr = 1;
            for (com.reserve.admin.model.Litige l : litigeRepository.findAll()) {
                Row row = sheetLitiges.createRow(lr++);
                row.createCell(0).setCellValue(l.getId());
                row.createCell(1).setCellValue(l.getTitre() != null ? l.getTitre() : "");
                row.createCell(2).setCellValue(l.getType() != null ? l.getType().name() : "");
                row.createCell(3).setCellValue(l.getStatut() != null ? l.getStatut().name() : "");
                row.createCell(4).setCellValue(l.getReserve() != null ? l.getReserve().getNom() : "");
                row.createCell(5).setCellValue(l.getDateOuverture() != null ? l.getDateOuverture().toString() : "");
                row.createCell(6).setCellValue(l.getDateEcheance() != null ? l.getDateEcheance().toString() : "");
            }
            for (int i = 0; i < litHeaders.length; i++) sheetLitiges.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            h.setContentDispositionFormData("attachment", "rapport_reserves.xlsx");
            return ResponseEntity.ok().headers(h).body(baos.toByteArray());
        }
    }

    // ─── Export PDF ──────────────────────────────────────────────────────────
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf() throws Exception {
        java.util.List<Reserve> reserves = reserveRepository.findAll();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(doc, baos);
        doc.open();

        // Titre
        com.itextpdf.text.Font titleFont = new com.itextpdf.text.Font(
                com.itextpdf.text.Font.FontFamily.HELVETICA, 18, com.itextpdf.text.Font.BOLD,
                new BaseColor(30, 64, 115));
        Paragraph title = new Paragraph("RAPPORT DES RÉSERVES ADMINISTRATIVES", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        doc.add(title);

        Paragraph subtitle = new Paragraph("Total : " + reserves.size() + " réserves — Superficie totale : "
                + Math.round(reserves.stream().mapToDouble((Reserve r) -> r.getSuperficie() != null ? r.getSuperficie() : 0.0).sum())
                + " ha",
                new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 11, com.itextpdf.text.Font.ITALIC));
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(15);
        doc.add(subtitle);

        // Tableau
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);

        BaseColor headerBg = new BaseColor(30, 64, 115);
        com.itextpdf.text.Font headerFont = new com.itextpdf.text.Font(
                com.itextpdf.text.Font.FontFamily.HELVETICA, 10, com.itextpdf.text.Font.BOLD, BaseColor.WHITE);
        com.itextpdf.text.Font cellFont = new com.itextpdf.text.Font(
                com.itextpdf.text.Font.FontFamily.HELVETICA, 9);

        String[] cols = {"Nom", "Localisation", "Superficie (ha)", "Type", "Statut", "Propriétaire"};
        for (String col : cols) {
            PdfPCell cell = new PdfPCell(new Phrase(col, headerFont));
            cell.setBackgroundColor(headerBg);
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        boolean alt = false;
        for (Reserve r : reserves) {
            BaseColor rowBg = alt ? new BaseColor(240, 245, 255) : BaseColor.WHITE;
            String[] vals = {
                r.getNom() != null ? r.getNom() : "",
                r.getLocalisation() != null ? r.getLocalisation() : "",
                r.getSuperficie() != null ? String.valueOf(r.getSuperficie()) : "",
                r.getType() != null ? r.getType() : "",
                r.getStatut() != null ? r.getStatut() : "",
                r.getProprietaire() != null ? r.getProprietaire() : ""
            };
            for (String val : vals) {
                PdfPCell c = new PdfPCell(new Phrase(val, cellFont));
                c.setBackgroundColor(rowBg);
                c.setPadding(5);
                table.addCell(c);
            }
            alt = !alt;
        }
        doc.add(table);
        doc.close();

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_PDF);
        h.setContentDispositionFormData("attachment", "rapport_reserves.pdf");
        return ResponseEntity.ok().headers(h).body(baos.toByteArray());
    }
}
