package com.reserve.admin.dto;

/**
 * DTO retournant les compteurs d'entités liées à une réserve.
 * Utilisé par GET /api/reserves/{id}/stats
 */
public class ReserveStatsDTO {

    private Long reserveId;
    private long nbDocuments;
    private long nbLitiges;
    private long nbOccupations;
    private long nbAlertes;
    private long nbProjets;

    public ReserveStatsDTO() {}

    public ReserveStatsDTO(Long reserveId, long nbDocuments, long nbLitiges,
                           long nbOccupations, long nbAlertes, long nbProjets) {
        this.reserveId = reserveId;
        this.nbDocuments = nbDocuments;
        this.nbLitiges = nbLitiges;
        this.nbOccupations = nbOccupations;
        this.nbAlertes = nbAlertes;
        this.nbProjets = nbProjets;
    }

    public Long getReserveId() { return reserveId; }
    public void setReserveId(Long reserveId) { this.reserveId = reserveId; }

    public long getNbDocuments() { return nbDocuments; }
    public void setNbDocuments(long nbDocuments) { this.nbDocuments = nbDocuments; }

    public long getNbLitiges() { return nbLitiges; }
    public void setNbLitiges(long nbLitiges) { this.nbLitiges = nbLitiges; }

    public long getNbOccupations() { return nbOccupations; }
    public void setNbOccupations(long nbOccupations) { this.nbOccupations = nbOccupations; }

    public long getNbAlertes() { return nbAlertes; }
    public void setNbAlertes(long nbAlertes) { this.nbAlertes = nbAlertes; }

    public long getNbProjets() { return nbProjets; }
    public void setNbProjets(long nbProjets) { this.nbProjets = nbProjets; }
}
