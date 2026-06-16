package com.kinetic.dtos;

/** Resposta do upload de mídia: a URL pública do arquivo no Supabase Storage. */
public record MediaUploadResponse(String url) {}
