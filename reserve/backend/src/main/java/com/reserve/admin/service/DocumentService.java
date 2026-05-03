package com.reserve.admin.service;

import com.reserve.admin.model.Document;

import java.util.List;
import java.util.Optional;

public interface DocumentService {
    Document saveDocument(Document document);
    List<Document> getAllDocuments();
    Optional<Document> getDocumentById(Long id);
    Document updateDocument(Long id, Document document);
    void deleteDocument(Long id);
}
