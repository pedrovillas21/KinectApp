package com.kinetic.repositories;

import com.kinetic.models.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    /** Listagem paginada de empresas (ordenada da mais recente para a mais antiga). */
    Page<Company> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByCnpj(String cnpj);
}
